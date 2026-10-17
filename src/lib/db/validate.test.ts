import { describe, expect, it } from 'vitest'
import seed from '@/data/db.json'
import type { CatalogData, Product } from '@/types/catalog'
import { DB_SCHEMA_VERSION, validateCatalogData } from './validate'

const product: Product = {
  id: 'pm-0001',
  name: 'Chinelo Teste',
  description: 'Descrição',
  price: 30,
  promoPrice: 27,
  category: 'chinelos',
  distributor: 'ipanema',
  images: ['/produtos/a.JPG'],
  isFeatured: false,
  status: 'active',
  createdAt: '2026-10-01T12:00:00.000Z',
  sizes: '34 ao 39',
  colors: ['Preto'],
  gender: 'feminino',
  tags: ['praia'],
  updatedAt: '2026-10-02T12:00:00.000Z',
}

function db(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: DB_SCHEMA_VERSION,
    categories: [{ id: 'chinelos', name: 'Chinelos', createdAt: '2026-05-30T12:00:00.000Z' }],
    distributors: [{ id: 'ipanema', name: 'Ipanema', createdAt: '2026-05-30T12:00:00.000Z' }],
    products: [product],
    ...overrides,
  }
}

function errorOf(value: unknown): string {
  const result = validateCatalogData(value)
  if (result.ok) throw new Error('esperava falha na validação')
  return result.error
}

describe('validateCatalogData', () => {
  it('aceita o seed publicado (src/data/db.json)', () => {
    const result = validateCatalogData(seed)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.products).toHaveLength(seed.products.length)
  })

  it('aceita campos opcionais do produto e productSeq', () => {
    const result = validateCatalogData(db({ productSeq: 120 }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.productSeq).toBe(120)
    expect(result.data.products[0]).toEqual(product)
  })

  it('recusa productSeq que não seja inteiro >= 0', () => {
    expect(errorOf(db({ productSeq: -1 }))).toMatch(/productSeq/)
    expect(errorOf(db({ productSeq: 1.5 }))).toMatch(/productSeq/)
    expect(errorOf(db({ productSeq: '7' }))).toMatch(/productSeq/)
  })

  it('recusa estrutura e versão desconhecidas', () => {
    expect(errorOf(null)).toMatch(/não é um banco/)
    expect(errorOf([])).toMatch(/não é um banco/)
    expect(errorOf(db({ schemaVersion: 2 }))).toMatch(/Versão do banco/)
    expect(errorOf(db({ products: undefined }))).toMatch(/Faltam as listas/)
  })

  it('cita o 1º produto inválido com posição e id', () => {
    const products = [product, { ...product, id: 101 }]
    expect(errorOf(db({ products }))).toBe('Produto nº 2 (id 101): o campo "id" deve ser um texto não vazio.')
  })

  it('valida campos obrigatórios e tipos dos produtos', () => {
    const { name: _name, ...noName } = product
    void _name
    expect(errorOf(db({ products: [noName] }))).toMatch(/"name"/)
    expect(errorOf(db({ products: [{ ...product, price: -1 }] }))).toMatch(/"price"/)
    expect(errorOf(db({ products: [{ ...product, price: '30' }] }))).toMatch(/"price"/)
    expect(errorOf(db({ products: [{ ...product, promoPrice: Number.NaN }] }))).toMatch(/"promoPrice"/)
    expect(errorOf(db({ products: [{ ...product, images: '/produtos/a.JPG' }] }))).toMatch(/"images"/)
    expect(errorOf(db({ products: [{ ...product, images: [1] }] }))).toMatch(/"images"/)
    expect(errorOf(db({ products: [{ ...product, status: 'draft' }] }))).toMatch(/"status"/)
    expect(errorOf(db({ products: [{ ...product, isFeatured: 'sim' }] }))).toMatch(/"isFeatured"/)
    expect(errorOf(db({ products: [{ ...product, createdAt: 'ontem' }] }))).toMatch(/"createdAt"/)
    expect(errorOf(db({ products: [{ ...product, gender: 'outro' }] }))).toMatch(/"gender"/)
    expect(errorOf(db({ products: [{ ...product, tags: 'praia' }] }))).toMatch(/"tags"/)
    expect(errorOf(db({ products: ['pm-0001'] }))).toBe('Produto nº 1: o item deve ser um objeto.')
  })

  it('recusa ids repetidos', () => {
    expect(errorOf(db({ products: [product, { ...product }] }))).toBe('Produto nº 2 (id pm-0001): id repetido.')
    const categories = [
      { id: 'chinelos', name: 'Chinelos', createdAt: '2026-05-30T12:00:00.000Z' },
      { id: 'chinelos', name: 'Outros', createdAt: '2026-05-30T12:00:00.000Z' },
    ]
    expect(errorOf(db({ categories }))).toBe('Categoria nº 2 (id chinelos): id repetido.')
  })

  it('valida categorias e distribuidores', () => {
    expect(errorOf(db({ categories: [{ id: 'x', name: 'X', createdAt: '2026-05-30' }] }))).toMatch(
      /^Categoria nº 1 \(id x\): o campo "name"/,
    )
    expect(errorOf(db({ distributors: [{ id: 'ipanema', name: 'Ipanema' }] }))).toMatch(
      /^Distribuidor nº 1 \(id ipanema\): o campo "createdAt"/,
    )
  })

  it('remove opcionais nulos, completa descrição ausente e preserva campos extras', () => {
    const { description: _description, ...noDescription } = product
    void _description
    const result = validateCatalogData(
      db({ productSeq: null, extra: 'ok', products: [{ ...noDescription, promoPrice: null, sizes: null, code: 'X' }] }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const data = result.data as CatalogData & { extra?: string }
    const p = data.products[0] as Product & { code?: string }
    expect('productSeq' in data).toBe(false)
    expect(data.extra).toBe('ok')
    expect('promoPrice' in p).toBe(false)
    expect('sizes' in p).toBe(false)
    expect(p.description).toBe('')
    expect(p.code).toBe('X')
  })

  it('não muta a entrada', () => {
    const input = db({ products: [{ ...product, promoPrice: null }] })
    validateCatalogData(input)
    expect((input.products as Array<Record<string, unknown>>)[0].promoPrice).toBeNull()
  })
})
