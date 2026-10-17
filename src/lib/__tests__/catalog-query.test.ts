import { describe, expect, it } from 'vitest'
import { queryProducts, resolveSort } from '@/lib/catalog-query'
import type { Category, Distributor, Product } from '@/types/catalog'

const categories: Category[] = [
  { id: 'tenis', name: 'Tênis', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'chinelos', name: 'Chinelos', createdAt: '2026-01-01T00:00:00Z' },
]
const distributors: Distributor[] = [
  { id: 'alpha', name: 'Alpha', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'ipanema', name: 'Ipanema', createdAt: '2026-01-01T00:00:00Z' },
]

function product(over: Partial<Product> & Pick<Product, 'id' | 'name'>): Product {
  return {
    description: '',
    price: 50,
    category: 'tenis',
    distributor: 'alpha',
    images: [],
    isFeatured: false,
    status: 'active',
    createdAt: '2026-10-01T00:00:00Z',
    ...over,
  }
}

const products: Product[] = [
  product({ id: 'pm-0001', name: 'Tênis Alpha A62 Preto', price: 37, createdAt: '2026-10-01T00:00:00Z' }),
  product({ id: 'pm-0002', name: 'Tênis Alpha A62 Azul Marinho', price: 40, promoPrice: 35, createdAt: '2026-10-05T00:00:00Z', isFeatured: true }),
  product({ id: 'pm-0003', name: 'Chinelo Ipanema Day Fem Rosa', price: 12.5, promoPrice: 12, category: 'chinelos', distributor: 'ipanema', createdAt: '2026-10-03T00:00:00Z' }),
  product({ id: 'pm-0004', name: 'Chinelo Ipanema Corações', price: 0, category: 'chinelos', distributor: 'ipanema', createdAt: '2026-10-04T00:00:00Z' }),
  product({ id: 'pm-0005', name: 'Tênis Inativo', price: 99, status: 'inactive' }),
]
const source = { products, categories, distributors }

describe('queryProducts', () => {
  it('lista só ativos por padrão, mais recentes primeiro', () => {
    const r = queryProducts(source)
    expect(r.total).toBe(4)
    expect(r.items.map((p) => p.id)).toEqual(['pm-0002', 'pm-0004', 'pm-0003', 'pm-0001'])
  })

  it('status "all" inclui inativos', () => {
    expect(queryProducts(source, { status: 'all' }).total).toBe(5)
    expect(queryProducts(source, { status: 'inactive' }).total).toBe(1)
  })

  it('busca ignora acentos/caixa e cobre marca, categoria e código', () => {
    expect(queryProducts(source, { search: 'TENIS azul' }).items.map((p) => p.id)).toEqual(['pm-0002'])
    expect(queryProducts(source, { search: 'ipanema' }).total).toBe(2)
    expect(queryProducts(source, { search: 'chinelos' }).total).toBe(2)
    expect(queryProducts(source, { search: 'PM-0003' }).items[0].id).toBe('pm-0003')
    expect(queryProducts(source, { search: 'pm0001' }).items[0].id).toBe('pm-0001')
    expect(queryProducts(source, { search: 'inexistente' }).total).toBe(0)
  })

  it('ranqueia nome que começa com o termo acima de ocorrências no meio', () => {
    const r = queryProducts(source, { search: 'chinelo' })
    expect(r.items.every((p) => p.category === 'chinelos')).toBe(true)
    expect(resolveSort({ search: 'chinelo' })).toBe('relevance')
    expect(resolveSort({ sort: 'relevance' })).toBe('recent')
  })

  it('filtra por categoria/distribuidor com facetas que ignoram o próprio filtro', () => {
    const r = queryProducts(source, { categories: ['chinelos'] })
    expect(r.total).toBe(2)
    expect(r.facets.categories).toEqual({ tenis: 2, chinelos: 2 })
    expect(r.facets.distributors).toEqual({ ipanema: 2 })
  })

  it('filtra por preço efetivo e exclui "sob consulta" quando há faixa', () => {
    const r = queryProducts(source, { minPrice: 10, maxPrice: 36 })
    expect(r.items.map((p) => p.id).sort()).toEqual(['pm-0002', 'pm-0003'])
    expect(r.facets.priceRange).toEqual({ min: 12, max: 37 })
  })

  it('ordena por preço com "sob consulta" sempre no fim', () => {
    const asc = queryProducts(source, { sort: 'price-asc' }).items.map((p) => p.id)
    const desc = queryProducts(source, { sort: 'price-desc' }).items.map((p) => p.id)
    expect(asc).toEqual(['pm-0003', 'pm-0002', 'pm-0001', 'pm-0004'])
    expect(desc).toEqual(['pm-0001', 'pm-0002', 'pm-0003', 'pm-0004'])
  })

  it('destaques e promoções', () => {
    expect(queryProducts(source, { featured: true }).items.map((p) => p.id)).toEqual(['pm-0002'])
    expect(queryProducts(source, { onSale: true }).total).toBe(2)
  })

  it('pagina e limita a página ao intervalo válido', () => {
    const r = queryProducts(source, { pageSize: 3, page: 9 })
    expect(r.pageCount).toBe(2)
    expect(r.page).toBe(2)
    expect(r.items).toHaveLength(1)
  })

  it('aguenta 20 mil produtos com folga', () => {
    const big = Array.from({ length: 20_000 }, (_, i) =>
      product({ id: `pm-t${i}`, name: `Produto ${i} ${i % 2 ? 'Sandália' : 'Tênis'}`, price: 10 + (i % 300) }),
    )
    const t0 = performance.now()
    const r = queryProducts({ products: big, categories, distributors }, { search: 'sandalia', sort: 'price-asc', page: 3 })
    const elapsed = performance.now() - t0
    expect(r.total).toBe(10_000)
    expect(elapsed).toBeLessThan(1500)
  })
})
