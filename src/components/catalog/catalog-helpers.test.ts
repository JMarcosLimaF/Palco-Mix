import { describe, expect, it } from 'vitest'
import {
  buildActiveFilterChips,
  buildPriceShortcuts,
  catalogTitle,
  colorSwatches,
  effectiveSort,
  parsePriceInput,
  parseSizeOptions,
  priceRangeLabel,
  productWhatsappMessage,
} from './catalog-helpers'

/** Intl usa espaço não separável entre "R$" e o número */
const plain = (text: string) => text.replace(/\s/g, ' ')

const lookups = {
  categoryById: new Map([['tenis', { name: 'Tênis' }]]),
  distributorById: new Map([['pegada', { name: 'Pegada' }]]),
}

describe('parseSizeOptions', () => {
  it('gera cada número de uma faixa simples', () => {
    expect(parseSizeOptions('34 ao 39')).toEqual({ kind: 'list', options: ['34', '35', '36', '37', '38', '39'], text: '34 ao 39' })
    expect(parseSizeOptions('Numeração do 37 ao 43')?.kind).toBe('list')
    expect(parseSizeOptions('17-27')).toMatchObject({ kind: 'list', options: expect.arrayContaining(['17', '27']) })
  })

  it('entende numeração dupla (33/34 ao 39/40)', () => {
    expect(parseSizeOptions('33/34 ao 39/40')).toMatchObject({ options: ['33/34', '35/36', '37/38', '39/40'] })
  })

  it('aceita listas separadas por vírgula', () => {
    expect(parseSizeOptions('38, 36,37')).toMatchObject({ options: ['36', '37', '38'] })
  })

  it('cai para texto em formatos desconhecidos', () => {
    expect(parseSizeOptions('Tamanho único')).toEqual({ kind: 'text', text: 'Tamanho único' })
    expect(parseSizeOptions('P, M e G')).toEqual({ kind: 'text', text: 'P, M e G' })
    expect(parseSizeOptions('')).toBeNull()
    expect(parseSizeOptions(undefined)).toBeNull()
  })
})

describe('preço', () => {
  it('lê valores digitados com vírgula, R$ e milhar', () => {
    expect(parsePriceInput('59,90')).toBe(59.9)
    expect(parsePriceInput('R$ 1.234,5')).toBe(1234.5)
    expect(parsePriceInput('1.000')).toBe(1000)
    expect(parsePriceInput('80')).toBe(80)
    expect(parsePriceInput('')).toBeUndefined()
    expect(parsePriceInput('abc')).toBeNull()
  })

  it('gera atalhos crescentes dentro da faixa', () => {
    const shortcuts = buildPriceShortcuts({ min: 12, max: 250 })
    expect(shortcuts.length).toBeGreaterThanOrEqual(3)
    expect(shortcuts[0]).toMatchObject({ max: expect.any(Number) })
    expect(shortcuts[0].min).toBeUndefined()
    expect(shortcuts.at(-1)?.max).toBeUndefined()
    for (const s of shortcuts) {
      if (s.min !== undefined) expect(s.min).toBeGreaterThan(12)
      if (s.max !== undefined) expect(s.max).toBeLessThan(250)
    }
  })

  it('não gera atalhos para faixas estreitas', () => {
    expect(buildPriceShortcuts({ min: 50, max: 55 })).toEqual([])
    expect(buildPriceShortcuts({ min: 0, max: 0 })).toEqual([])
  })

  it('rotula faixas', () => {
    expect(plain(priceRangeLabel(undefined, 60))).toBe('Até R$ 60')
    expect(plain(priceRangeLabel(150, undefined))).toBe('A partir de R$ 150')
    expect(plain(priceRangeLabel(60, 100))).toBe('R$ 60 – 100')
  })
})

describe('vitrine', () => {
  it('título contextual', () => {
    expect(catalogTitle({}, lookups)).toBe('Catálogo')
    expect(catalogTitle({ search: 'chinelo' }, lookups)).toBe('Resultados para “chinelo”')
    expect(catalogTitle({ categories: ['tenis'] }, lookups)).toBe('Tênis')
    expect(catalogTitle({ featured: true }, lookups)).toBe('Em destaque')
    expect(catalogTitle({ sort: 'recent' }, lookups)).toBe('Lançamentos')
    expect(catalogTitle({ sort: 'recent', onSale: true }, lookups)).toBe('Em promoção')
  })

  it('ordenação efetiva', () => {
    expect(effectiveSort({})).toBe('recent')
    expect(effectiveSort({ search: 'x' })).toBe('relevance')
    expect(effectiveSort({ sort: 'relevance' })).toBe('recent')
    expect(effectiveSort({ sort: 'price-asc', search: 'x' })).toBe('price-asc')
  })

  it('chips removíveis', () => {
    const chips = buildActiveFilterChips(
      { search: 'azul', categories: ['tenis', 'x'], distributors: ['pegada'], maxPrice: 60, onSale: true },
      lookups,
    )
    expect(chips.map((c) => plain(c.label))).toEqual(['“azul”', 'Tênis', 'x', 'Pegada', 'Até R$ 60', 'Em promoção'])
    expect(chips[1].patch).toEqual({ categories: ['x'] })
  })
})

describe('produto', () => {
  it('mensagem do WhatsApp com e sem numeração', () => {
    expect(productWhatsappMessage({ id: 'pm-0001', name: 'Sandália X' })).toBe(
      'Olá! Tenho interesse no produto *Sandália X* (código PM-0001). Ainda tem disponível?',
    )
    expect(productWhatsappMessage({ id: 'pm-0001', name: 'Sandália X' }, '38')).toBe(
      'Olá! Tenho interesse no produto *Sandália X* (código PM-0001), numeração 38. Ainda tem disponível?',
    )
  })

  it('amostras de cor', () => {
    expect(colorSwatches('Preto')).toHaveLength(1)
    expect(colorSwatches('Preto/Branco')).toHaveLength(2)
    expect(colorSwatches('Off White')).toHaveLength(1)
    expect(colorSwatches('Estampado')).toHaveLength(0)
  })
})
