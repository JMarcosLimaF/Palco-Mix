/**
 * Motor de consulta do catálogo (puro, sem React, sem I/O).
 *
 * É o "servidor" da camada local: busca textual com ranking, filtros,
 * facetas, ordenação e paginação. Pensado para dezenas de milhares de
 * produtos — o índice normalizado é memoizado por referência do array.
 * Ao migrar para um backend, esta mesma semântica vira a query SQL/API.
 */
import type {
  Category,
  Distributor,
  Product,
  ProductFacets,
  ProductQuery,
  ProductQueryResult,
  ProductSort,
} from '@/types/catalog'
import { CATALOG_PAGE_SIZE } from '@/config/site'
import { effectivePrice, hasPromo, normalizeText } from './utils'

const NON_ALNUM = /[^a-z0-9]+/g
/** Palavras unidas por pontuação: "coca-cola", "d'calce", "pm-0012", "slip-on". */
const PUNCTUATED_WORD = /[a-z0-9]+(?:[^a-z0-9 ]+[a-z0-9]+)+/g

/**
 * Normalização exclusiva da busca: além de acentos/caixa, a pontuação vira
 * espaço — "D’Calce" → "d calce", "coca cola," → "coca cola".
 */
export function normalizeSearch(value: string): string {
  return normalizeText(value).replace(NON_ALNUM, ' ').trim()
}

/**
 * Texto indexável: forma com espaços + palavras com pontuação coladas, para
 * achar quem digita sem hífen/apóstrofo ("cocacola", "dcalce", "pm0012").
 */
function searchable(value: string): string {
  const text = normalizeText(value)
  const joined = (text.match(PUNCTUATED_WORD) ?? []).map((word) => word.replace(NON_ALNUM, ''))
  return [text.replace(NON_ALNUM, ' ').trim(), ...joined].join(' ')
}

export interface CatalogSource {
  products: Product[]
  categories: Category[]
  distributors: Distributor[]
}

interface IndexedProduct {
  product: Product
  name: string
  /** marca + categoria normalizados */
  meta: string
  /** tudo que é pesquisável, normalizado */
  haystack: string
  code: string
  price: number
  created: number
}

interface IndexCacheEntry {
  categories: Category[]
  distributors: Distributor[]
  index: IndexedProduct[]
}

const indexCache = new WeakMap<Product[], IndexCacheEntry>()

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })

/** Constrói (ou reaproveita) o índice de busca para a fonte informada. */
export function getIndex(source: CatalogSource): IndexedProduct[] {
  const cached = indexCache.get(source.products)
  if (cached && cached.categories === source.categories && cached.distributors === source.distributors) {
    return cached.index
  }

  const catName = new Map(source.categories.map((c) => [c.id, c.name]))
  const distName = new Map(source.distributors.map((d) => [d.id, d.name]))

  const index = source.products.map<IndexedProduct>((product) => {
    const brand = distName.get(product.distributor) ?? ''
    // marca toda colada também casa: "beirario", "cocacolashoes"
    const brandCompact = normalizeText(brand).replace(NON_ALNUM, '')
    const name = normalizeSearch(product.name)
    const meta = `${searchable(`${brand} ${catName.get(product.category) ?? ''}`)} ${brandCompact}`
    const code = normalizeText(product.id)
    const haystack = `${searchable(
      [
        product.name,
        brand,
        catName.get(product.category),
        product.id,
        product.sizes,
        product.gender,
        ...(product.colors ?? []),
        ...(product.tags ?? []),
        product.description,
      ]
        .filter(Boolean)
        .join(' '),
    )} ${brandCompact}`
    const created = new Date(product.createdAt).getTime()
    return {
      product,
      name,
      meta,
      haystack,
      code,
      price: effectivePrice(product),
      created: Number.isNaN(created) ? 0 : created,
    }
  })

  indexCache.set(source.products, { categories: source.categories, distributors: source.distributors, index })
  return index
}

export function tokenize(search: string | undefined): string[] {
  if (!search) return []
  return normalizeSearch(search).split(' ').filter(Boolean)
}

/** Pontua um produto para os tokens; retorna 0 quando algum token não casa. */
export function scoreProduct(item: IndexedProduct, tokens: string[], rawQuery: string): number {
  if (tokens.length === 0) return 1
  let score = 0
  const compactQuery = rawQuery.replace(/[^a-z0-9]/g, '')
  if (compactQuery && item.code.replace(/[^a-z0-9]/g, '') === compactQuery) score += 50

  for (const token of tokens) {
    if (!item.haystack.includes(token)) return 0
    if (item.name.startsWith(token)) score += 6
    else if (item.name.includes(` ${token}`)) score += 4
    else if (item.name.includes(token)) score += 3
    else if (item.meta.includes(token)) score += 2
    else score += 0.5
  }
  return score
}

/** Preço para ordenação: "sob consulta" (0) vai sempre para o fim. */
const sortablePrice = (item: IndexedProduct, dir: 1 | -1) => (item.price > 0 ? item.price * dir : Number.POSITIVE_INFINITY)

function compare(sort: ProductSort, a: IndexedProduct & { score: number }, b: IndexedProduct & { score: number }) {
  switch (sort) {
    case 'relevance':
      return b.score - a.score || b.created - a.created || collator.compare(a.name, b.name)
    case 'price-asc':
      return sortablePrice(a, 1) - sortablePrice(b, 1) || collator.compare(a.name, b.name)
    case 'price-desc':
      return sortablePrice(a, -1) - sortablePrice(b, -1) || collator.compare(a.name, b.name)
    case 'name-asc':
      return collator.compare(a.product.name, b.product.name)
    case 'name-desc':
      return collator.compare(b.product.name, a.product.name)
    case 'recent':
    default:
      return b.created - a.created || collator.compare(a.product.id, b.product.id)
  }
}

export function resolveSort(query: ProductQuery): ProductSort {
  const hasSearch = tokenize(query.search).length > 0
  if (!query.sort) return hasSearch ? 'relevance' : 'recent'
  if (query.sort === 'relevance' && !hasSearch) return 'recent'
  return query.sort
}

/** Executa a consulta completa: filtros + facetas + ordenação + paginação. */
export function queryProducts(source: CatalogSource, query: ProductQuery = {}): ProductQueryResult {
  const index = getIndex(source)
  const tokens = tokenize(query.search)
  const rawQuery = normalizeText(query.search ?? '')
  const status = query.status ?? 'active'
  const cats = query.categories?.length ? new Set(query.categories) : null
  const dists = query.distributors?.length ? new Set(query.distributors) : null
  const min = typeof query.minPrice === 'number' && Number.isFinite(query.minPrice) ? query.minPrice : null
  const max = typeof query.maxPrice === 'number' && Number.isFinite(query.maxPrice) ? query.maxPrice : null

  const facets: ProductFacets = {
    categories: {},
    distributors: {},
    priceRange: { min: Number.POSITIVE_INFINITY, max: 0 },
  }
  const matches: Array<IndexedProduct & { score: number }> = []

  for (const item of index) {
    const p = item.product
    if (status !== 'all' && p.status !== status) continue
    if (query.featured && !p.isFeatured) continue
    if (query.onSale && !hasPromo(p)) continue
    const score = scoreProduct(item, tokens, rawQuery)
    if (score === 0) continue

    const okCat = !cats || cats.has(p.category)
    const okDist = !dists || dists.has(p.distributor)
    // com faixa de preço ativa, itens "sob consulta" (preço 0) ficam de fora
    const okPrice =
      (min === null && max === null) ||
      (item.price > 0 && (min === null || item.price >= min) && (max === null || item.price <= max))

    if (okDist && okPrice) facets.categories[p.category] = (facets.categories[p.category] ?? 0) + 1
    if (okCat && okPrice) facets.distributors[p.distributor] = (facets.distributors[p.distributor] ?? 0) + 1
    if (okCat && okDist && item.price > 0) {
      if (item.price < facets.priceRange.min) facets.priceRange.min = item.price
      if (item.price > facets.priceRange.max) facets.priceRange.max = item.price
    }
    if (okCat && okDist && okPrice) matches.push({ ...item, score })
  }

  if (!Number.isFinite(facets.priceRange.min)) facets.priceRange = { min: 0, max: 0 }

  const sort = resolveSort(query)
  matches.sort((a, b) => compare(sort, a, b))

  const pageSize = Math.max(1, Math.floor(query.pageSize ?? CATALOG_PAGE_SIZE))
  const total = matches.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, Math.floor(query.page ?? 1)), pageCount)
  const start = (page - 1) * pageSize

  return {
    items: matches.slice(start, start + pageSize).map((m) => m.product),
    total,
    page,
    pageSize,
    pageCount,
    facets,
  }
}
