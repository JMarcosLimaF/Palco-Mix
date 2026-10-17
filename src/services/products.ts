/**
 * Serviço de produtos. API assíncrona de propósito: hoje lê/grava no banco
 * local, amanhã pode chamar uma API/Supabase sem mudar quem consome.
 */
import { queryProducts } from '@/lib/catalog-query'
import { localDb } from '@/lib/db/local-db'
import { hasPromo, normalizeText } from '@/lib/utils'
import type { CatalogData, Product, ProductInput, ProductQuery, ProductQueryResult, ProductStatus } from '@/types/catalog'
import { ServiceError } from './errors'

const ID_PREFIX = 'pm-'

function nextProductId(products: Product[]): string {
  let max = 0
  for (const p of products) {
    if (!p.id.startsWith(ID_PREFIX)) continue
    const n = Number(p.id.slice(ID_PREFIX.length))
    if (Number.isFinite(n) && n > max) max = n
  }
  return `${ID_PREFIX}${String(max + 1).padStart(4, '0')}`
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

/** Valida e normaliza a entrada do formulário. */
export function sanitizeProductInput(input: ProductInput, data: CatalogData): ProductInput {
  const name = input.name?.trim() ?? ''
  if (name.length < 2) throw new ServiceError('validation', 'Informe o nome do produto.')
  // preço 0 = "sob consulta"
  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new ServiceError('validation', 'Informe um preço válido (ou marque como sob consulta).')
  }
  const promo =
    input.promoPrice === undefined || input.promoPrice === null || Number.isNaN(input.promoPrice)
      ? undefined
      : round2(input.promoPrice)
  if (promo !== undefined && input.price === 0) {
    throw new ServiceError('validation', 'Produto sob consulta não pode ter preço promocional.')
  }
  if (promo !== undefined && (promo <= 0 || promo >= input.price)) {
    throw new ServiceError('validation', 'O preço promocional deve ser menor que o preço normal.')
  }
  if (!data.categories.some((c) => c.id === input.category)) {
    throw new ServiceError('validation', 'Selecione uma categoria válida.')
  }
  if (!data.distributors.some((d) => d.id === input.distributor)) {
    throw new ServiceError('validation', 'Selecione um distribuidor válido.')
  }
  const images = (input.images ?? []).map((i) => i.trim()).filter(Boolean)

  const clean: ProductInput = {
    name,
    description: input.description?.trim() ?? '',
    price: round2(input.price),
    category: input.category,
    distributor: input.distributor,
    images: Array.from(new Set(images)),
    isFeatured: Boolean(input.isFeatured),
    status: input.status === 'inactive' ? 'inactive' : 'active',
  }
  if (promo !== undefined) clean.promoPrice = promo
  if (input.sizes?.trim()) clean.sizes = input.sizes.trim()
  if (input.colors?.length) clean.colors = input.colors.map((c) => c.trim()).filter(Boolean)
  if (input.gender) clean.gender = input.gender
  if (input.tags?.length) clean.tags = input.tags.map((t) => t.trim()).filter(Boolean)
  return clean
}

export const productService = {
  async query(query: ProductQuery): Promise<ProductQueryResult> {
    return queryProducts(localDb.get(), query)
  },

  async list(options: { includeInactive?: boolean } = {}): Promise<Product[]> {
    const { products } = localDb.get()
    return options.includeInactive ? products : products.filter((p) => p.status === 'active')
  },

  /** Produtos em destaque ativos (carrossel / vitrine), mais recentes primeiro. */
  async featured(limit = 12): Promise<Product[]> {
    return queryProducts(localDb.get(), { featured: true, sort: 'recent', pageSize: limit }).items
  },

  async getById(id: string): Promise<Product | null> {
    return localDb.get().products.find((p) => p.id === id) ?? null
  },

  /** Produtos relacionados: mesma categoria, depois mesma marca. */
  async related(product: Product, limit = 8): Promise<Product[]> {
    const pool = localDb.get().products.filter((p) => p.status === 'active' && p.id !== product.id)
    const score = (p: Product) => (p.category === product.category ? 2 : 0) + (p.distributor === product.distributor ? 1 : 0)
    return pool
      .map((p) => ({ p, s: score(p) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || b.p.createdAt.localeCompare(a.p.createdAt))
      .slice(0, limit)
      .map((x) => x.p)
  },

  /** Sugestões rápidas para o campo de busca do cabeçalho. */
  async suggest(search: string, limit = 6): Promise<ProductQueryResult> {
    return queryProducts(localDb.get(), { search, sort: 'relevance', pageSize: limit })
  },

  async create(input: ProductInput): Promise<Product> {
    const data = localDb.get()
    const clean = sanitizeProductInput(input, data)
    const now = new Date().toISOString()
    const product: Product = { ...clean, id: nextProductId(data.products), createdAt: now, updatedAt: now }
    localDb.commit({ ...data, products: [product, ...data.products] })
    return product
  },

  async update(id: string, input: ProductInput): Promise<Product> {
    const data = localDb.get()
    const current = data.products.find((p) => p.id === id)
    if (!current) throw new ServiceError('not_found', 'Produto não encontrado.')
    const clean = sanitizeProductInput(input, data)
    const product: Product = { ...clean, id, createdAt: current.createdAt, updatedAt: new Date().toISOString() }
    localDb.commit({ ...data, products: data.products.map((p) => (p.id === id ? product : p)) })
    return product
  },

  /** Alterações rápidas (status/destaque) direto da tabela. */
  async patch(id: string, patch: Partial<Pick<Product, 'status' | 'isFeatured'>>): Promise<Product> {
    const data = localDb.get()
    const current = data.products.find((p) => p.id === id)
    if (!current) throw new ServiceError('not_found', 'Produto não encontrado.')
    const product: Product = { ...current, ...patch, updatedAt: new Date().toISOString() }
    localDb.commit({ ...data, products: data.products.map((p) => (p.id === id ? product : p)) })
    return product
  },

  async setStatus(ids: string[], status: ProductStatus): Promise<void> {
    const set = new Set(ids)
    const now = new Date().toISOString()
    localDb.update((data) => ({
      ...data,
      products: data.products.map((p) => (set.has(p.id) ? { ...p, status, updatedAt: now } : p)),
    }))
  },

  async remove(id: string): Promise<void> {
    const data = localDb.get()
    if (!data.products.some((p) => p.id === id)) throw new ServiceError('not_found', 'Produto não encontrado.')
    localDb.commit({ ...data, products: data.products.filter((p) => p.id !== id) })
  },

  async removeMany(ids: string[]): Promise<number> {
    const set = new Set(ids)
    const data = localDb.get()
    const products = data.products.filter((p) => !set.has(p.id))
    localDb.commit({ ...data, products })
    return data.products.length - products.length
  },

  /** Verifica se já existe produto com o mesmo nome (aviso no formulário). */
  async nameExists(name: string, ignoreId?: string): Promise<boolean> {
    const n = normalizeText(name)
    return localDb.get().products.some((p) => p.id !== ignoreId && normalizeText(p.name) === n)
  },

  countOnSale(products: Product[]): number {
    return products.filter(hasPromo).length
  },
}
