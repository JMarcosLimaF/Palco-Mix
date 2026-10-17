/**
 * Conversão entre a URL da vitrine (/catalogo?...) e `ProductQuery`.
 * Os filtros vivem na URL: links compartilháveis, voltar/avançar funcionam.
 *
 *   q=tenis  categoria=tenis,chinelos  distribuidor=pegada  min=50  max=200
 *   ordem=recentes|relevancia|menor-preco|maior-preco|a-z|z-a
 *   destaque=1  promo=1  pagina=2
 */
import { site } from '@/config/site'
import type { ProductQuery, ProductSort } from '@/types/catalog'

const SORT_TO_PARAM: Record<ProductSort, string> = {
  relevance: 'relevancia',
  recent: 'recentes',
  'price-asc': 'menor-preco',
  'price-desc': 'maior-preco',
  'name-asc': 'a-z',
  'name-desc': 'z-a',
}

const PARAM_TO_SORT = Object.fromEntries(
  Object.entries(SORT_TO_PARAM).map(([k, v]) => [v, k as ProductSort]),
) as Record<string, ProductSort>

const ALL_SORT_OPTIONS: Array<{ value: ProductSort; label: string }> = [
  { value: 'relevance', label: 'Mais relevantes' },
  { value: 'recent', label: 'Mais recentes' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'name-asc', label: 'Nome (A–Z)' },
  { value: 'name-desc', label: 'Nome (Z–A)' },
]

const PRICE_SORTS = new Set<ProductSort>(['price-asc', 'price-desc'])

/** Ordenações da vitrine (sem as de preço quando a loja não mostra preços). */
export const SORT_OPTIONS = site.showPrices ? ALL_SORT_OPTIONS : ALL_SORT_OPTIONS.filter((o) => !PRICE_SORTS.has(o.value))

/**
 * Remove da consulta da vitrine o que depende de preço (faixa, desconto à vista,
 * ordenação por preço) quando a loja não exibe preços — links antigos continuam válidos.
 */
export function storefrontQuery(query: ProductQuery): ProductQuery {
  if (site.showPrices) return query
  const { minPrice: _min, maxPrice: _max, onSale: _sale, ...rest } = query
  void _min
  void _max
  void _sale
  if (rest.sort && PRICE_SORTS.has(rest.sort)) delete rest.sort
  return rest
}

/** Parâmetro da URL que abre a Visualização Rápida de um produto. */
export const QUICK_VIEW_PARAM = 'p'

function list(value: string | null): string[] | undefined {
  if (!value) return undefined
  const items = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return items.length ? Array.from(new Set(items)) : undefined
}

function num(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

export function parseCatalogParams(params: URLSearchParams): ProductQuery {
  const query: ProductQuery = {}
  const q = params.get('q')?.trim()
  if (q) query.search = q
  const categories = list(params.get('categoria'))
  if (categories) query.categories = categories
  const distributors = list(params.get('distribuidor'))
  if (distributors) query.distributors = distributors
  const min = num(params.get('min'))
  if (min !== undefined) query.minPrice = min
  const max = num(params.get('max'))
  if (max !== undefined) query.maxPrice = max
  const sort = PARAM_TO_SORT[params.get('ordem') ?? '']
  if (sort) query.sort = sort
  if (params.get('destaque') === '1') query.featured = true
  if (params.get('promo') === '1') query.onSale = true
  const page = num(params.get('pagina'))
  if (page !== undefined && page >= 1) query.page = Math.floor(page)
  return query
}

export function toCatalogParams(query: ProductQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.search?.trim()) params.set('q', query.search.trim())
  if (query.categories?.length) params.set('categoria', query.categories.join(','))
  if (query.distributors?.length) params.set('distribuidor', query.distributors.join(','))
  if (query.minPrice !== undefined) params.set('min', String(query.minPrice))
  if (query.maxPrice !== undefined) params.set('max', String(query.maxPrice))
  if (query.sort) params.set('ordem', SORT_TO_PARAM[query.sort])
  if (query.featured) params.set('destaque', '1')
  if (query.onSale) params.set('promo', '1')
  if (query.page && query.page > 1) params.set('pagina', String(query.page))
  return params
}

/** Monta o link da vitrine: catalogHref({ categories: ['tenis'] }) → "/catalogo?categoria=tenis" */
export function catalogHref(query: ProductQuery = {}): string {
  const qs = toCatalogParams(query).toString()
  return qs ? `/catalogo?${qs}` : '/catalogo'
}

/** Quantos filtros (exceto busca, ordenação e página) estão ativos. */
export function countActiveFilters(query: ProductQuery): number {
  return (
    (query.categories?.length ?? 0) +
    (query.distributors?.length ?? 0) +
    (query.minPrice !== undefined || query.maxPrice !== undefined ? 1 : 0) +
    (query.featured ? 1 : 0) +
    (query.onSale ? 1 : 0)
  )
}
