import { describe, expect, it } from 'vitest'
import { catalogHref, countActiveFilters, parseCatalogParams, toCatalogParams } from '@/lib/catalog-params'

describe('catalog-params', () => {
  it('converte URL ↔ query (ida e volta)', () => {
    const url = 'q=tenis&categoria=tenis,chinelos&distribuidor=alpha&min=10&max=99.5&ordem=menor-preco&destaque=1&promo=1&pagina=3'
    const query = parseCatalogParams(new URLSearchParams(url))
    expect(query).toEqual({
      search: 'tenis',
      categories: ['tenis', 'chinelos'],
      distributors: ['alpha'],
      minPrice: 10,
      maxPrice: 99.5,
      sort: 'price-asc',
      featured: true,
      onSale: true,
      page: 3,
    })
    expect(parseCatalogParams(toCatalogParams(query))).toEqual(query)
  })

  it('ignora valores inválidos e página 1', () => {
    const q = parseCatalogParams(new URLSearchParams('min=abc&max=-3&ordem=xyz&pagina=0&categoria=,,'))
    expect(q).toEqual({})
    expect(toCatalogParams({ page: 1 }).toString()).toBe('')
  })

  it('aceita vírgula decimal', () => {
    expect(parseCatalogParams(new URLSearchParams('min=12,5')).minPrice).toBe(12.5)
  })

  it('monta links e conta filtros', () => {
    expect(catalogHref()).toBe('/catalogo')
    expect(catalogHref({ categories: ['tenis'] })).toBe('/catalogo?categoria=tenis')
    expect(countActiveFilters({ categories: ['a', 'b'], minPrice: 1, maxPrice: 2, onSale: true, search: 'x' })).toBe(4)
  })
})
