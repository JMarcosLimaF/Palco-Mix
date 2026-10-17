import { site } from '@/config/site'
import { describe, expect, it } from 'vitest'
import {
  buildActiveFilterChips,
  buildPriceShortcuts,
  catalogTitle,
  colorSwatches,
  discountBadgeLabel,
  effectiveSort,
  parsePriceInput,
  priceRangeLabel,
  productWhatsappMessage,
} from './catalog-helpers'

/** Intl usa espaço não separável entre "R$" e o número */
const plain = (text: string) => text.replace(/\s/g, ' ')

const lookups = {
  categoryById: new Map([['tenis', { name: 'Tênis' }]]),
  distributorById: new Map([['pegada', { name: 'Pegada' }]]),
}

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

  it('atalhos não compartilham limites (faixas semiabertas)', () => {
    const shortcuts = buildPriceShortcuts({ min: 12, max: 118 })
    expect(shortcuts.map((s) => plain(s.label))).toEqual(['Até R$ 19,99', 'R$ 20 – 39,99', 'R$ 40 – 69,99', 'A partir de R$ 70'])
    for (let i = 1; i < shortcuts.length; i++) {
      expect(shortcuts[i].min).toBeGreaterThan(shortcuts[i - 1].max as number)
    }
    // o rótulo do atalho é o mesmo do chip ativo
    for (const s of shortcuts) expect(s.label).toBe(priceRangeLabel(s.min, s.max))
  })

  it('selo de desconto à vista só a partir de 10%', () => {
    expect(discountBadgeLabel({ price: 30, promoPrice: 29 })).toBeNull()
    expect(discountBadgeLabel({ price: 100, promoPrice: 88 })).toBe('-12% à vista')
    expect(discountBadgeLabel({ price: 0, promoPrice: 10 })).toBeNull()
    expect(discountBadgeLabel({ price: 50 })).toBeNull()
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
    expect(catalogTitle({ sort: 'recent', onSale: true }, lookups)).toBe('Desconto à vista')
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
    expect(chips.map((c) => plain(c.label))).toEqual(['“azul”', 'Tênis', 'x', 'Pegada', 'Até R$ 60', 'Desconto à vista'])
    expect(chips[1].patch).toEqual({ categories: ['x'] })
  })
})

describe('produto', () => {
  it('mensagem do WhatsApp com e sem numeração', () => {
    expect(productWhatsappMessage({ id: 'pm-0001', name: 'Sandália X', price: 60 })).toBe(
      'Olá! Tenho interesse no produto *Sandália X* (código PM-0001). Ainda tem disponível?',
    )
    expect(productWhatsappMessage({ id: 'pm-0001', name: 'Sandália X', price: 60 }, '38')).toBe(
      'Olá! Tenho interesse no produto *Sandália X* (código PM-0001), numeração 38. Ainda tem disponível?',
    )
  })

  it('produto sob consulta: só pergunta o preço quando a loja exibe preços', () => {
    const msg = productWhatsappMessage({ id: 'pm-0002', name: 'Chinelo Y', price: 0 }, '33/34')
    expect(msg).toBe(
      site.showPrices
        ? 'Olá! Gostaria de saber o preço do produto *Chinelo Y* (código PM-0002), numeração 33/34. Ainda tem disponível?'
        : 'Olá! Tenho interesse no produto *Chinelo Y* (código PM-0002), numeração 33/34. Ainda tem disponível?',
    )
  })

  it('amostras de cor', () => {
    expect(colorSwatches('Preto')).toHaveLength(1)
    expect(colorSwatches('Preto/Branco')).toHaveLength(2)
    expect(colorSwatches('Off White')).toHaveLength(1)
    expect(colorSwatches('Estampado')).toHaveLength(0)
  })
})
