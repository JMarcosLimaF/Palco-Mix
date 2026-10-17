import { describe, expect, it } from 'vitest'
import { pageWindow } from '@/lib/pagination'
import { expandSizes } from '@/lib/sizes'
import { discountPercent, effectivePrice, formatBRL, hasPromo, isPriceOnRequest, normalizeText, slugify } from '@/lib/utils'

describe('utils', () => {
  it('normaliza e gera slugs', () => {
    expect(normalizeText('  Tênis   Coração ')).toBe('tenis coracao')
    expect(slugify("D'Calce Sandálias!")).toBe('d-calce-sandalias')
  })

  it('preços e promoções', () => {
    expect(formatBRL(106).replace(/\s/g, ' ')).toBe('R$ 106,00')
    expect(hasPromo({ price: 110, promoPrice: 106 })).toBe(true)
    expect(hasPromo({ price: 110, promoPrice: 120 })).toBe(false)
    expect(effectivePrice({ price: 110, promoPrice: 106 })).toBe(106)
    expect(discountPercent({ price: 100, promoPrice: 80 })).toBe(20)
    expect(isPriceOnRequest({ price: 0 })).toBe(true)
    expect(hasPromo({ price: 0, promoPrice: 10 })).toBe(false)
  })
})

describe('expandSizes', () => {
  it('faixas simples e pares', () => {
    expect(expandSizes('34 ao 39')).toEqual(['34', '35', '36', '37', '38', '39'])
    expect(expandSizes('37/43')).toHaveLength(7)
    expect(expandSizes('33/34 ao 39/40')).toEqual(['33/34', '35/36', '37/38', '39/40'])
    expect(expandSizes('37/38 ao 43/44')).toEqual(['37/38', '39/40', '41/42', '43/44'])
    expect(expandSizes('Único')).toBeNull()
    expect(expandSizes(undefined)).toBeNull()
  })
})

describe('pageWindow', () => {
  it('reticências nas pontas', () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(pageWindow(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20])
    expect(pageWindow(2, 20)).toEqual([1, 2, 3, 'gap', 20])
  })
})
