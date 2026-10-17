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

  it('aceita "do … ao", "até", prefixo e lista', () => {
    const range = ['34', '35', '36', '37', '38', '39']
    expect(expandSizes('do 34 ao 39')).toEqual(range)
    expect(expandSizes('34 até 39')).toEqual(range)
    expect(expandSizes('34-39')).toEqual(range)
    expect(expandSizes('Numeração do 37 ao 43')).toHaveLength(7)
    expect(expandSizes('35, 36, 37')).toEqual(['35', '36', '37'])
    expect(expandSizes('38, 36,37')).toEqual(['36', '37', '38'])
    expect(expandSizes('35; 36 e 37')).toEqual(['35', '36', '37'])
    expect(expandSizes('35/36, 33/34')).toEqual(['33/34', '35/36'])
    expect(expandSizes('38')).toEqual(['38'])
  })

  it('par único "33/34" é um tamanho só', () => {
    expect(expandSizes('33/34')).toEqual(['33/34'])
    expect(expandSizes('33 / 34')).toEqual(['33/34'])
  })

  it('texto livre não vira chips (precisa casar por inteiro)', () => {
    expect(expandSizes('34 ao 39 (sem 36)')).toBeNull()
    expect(expandSizes('34 ao 37 e 39')).toBeNull()
    expect(expandSizes('Infantil 20 ao 27 / Adulto 33 ao 38')).toBeNull()
    expect(expandSizes('2/3 anos')).toBeNull()
    expect(expandSizes('P, M e G')).toBeNull()
    expect(expandSizes('Tamanho único')).toBeNull()
    expect(expandSizes('33/34 ao 40/41')).toBeNull()
    expect(expandSizes('39 ao 34')).toBeNull()
    expect(expandSizes('  ')).toBeNull()
  })
})

describe('pageWindow', () => {
  it('reticências nas pontas', () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(pageWindow(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20])
    expect(pageWindow(2, 20)).toEqual([1, 2, 3, 'gap', 20])
  })
})
