import { describe, expect, it } from 'vitest'
import { categoryForm, distributorForm } from './forms'
import {
  adminProductsHref,
  caretAfterDigits,
  contactLinks,
  displayWebsite,
  filterAndSortTaxonomy,
  formatPhone,
  initials,
  isValidEmail,
  isValidPhone,
  isValidWebsite,
  normalizeWebsite,
  phoneHref,
  previewId,
  storeHref,
} from './logic'

const items = [
  { id: 'sandalias', name: 'Sandálias', description: 'Conforto e estilo', createdAt: '2026-09-01T12:00:00.000Z' },
  { id: 'chinelos', name: 'Chinelos', description: 'Leveza para a praia', createdAt: '2026-10-01T12:00:00.000Z' },
  { id: 'tenis', name: 'Tênis', createdAt: '2026-08-01T12:00:00.000Z' },
]

describe('filterAndSortTaxonomy', () => {
  it('busca sem acento/caixa em nome e descrição', () => {
    expect(filterAndSortTaxonomy(items, { query: 'SANDALIA', sort: 'name', usage: {} }).map((i) => i.id)).toEqual(['sandalias'])
    expect(filterAndSortTaxonomy(items, { query: 'praia', sort: 'name', usage: {} }).map((i) => i.id)).toEqual(['chinelos'])
    expect(filterAndSortTaxonomy(items, { query: 'tenis', sort: 'name', usage: {} }).map((i) => i.id)).toEqual(['tenis'])
    expect(filterAndSortTaxonomy(items, { query: 'xyz', sort: 'name', usage: {} })).toEqual([])
  })

  it('ordena por nome, uso e data', () => {
    const usage = { tenis: 9, chinelos: 3 }
    expect(filterAndSortTaxonomy(items, { query: '', sort: 'name', usage }).map((i) => i.id)).toEqual(['chinelos', 'sandalias', 'tenis'])
    expect(filterAndSortTaxonomy(items, { query: '', sort: 'usage', usage }).map((i) => i.id)).toEqual(['tenis', 'chinelos', 'sandalias'])
    expect(filterAndSortTaxonomy(items, { query: '', sort: 'recent', usage }).map((i) => i.id)).toEqual(['chinelos', 'sandalias', 'tenis'])
  })

  it('não altera o array original', () => {
    const copy = [...items]
    filterAndSortTaxonomy(items, { query: '', sort: 'usage', usage: { tenis: 1 } })
    expect(items).toEqual(copy)
  })
})

describe('previewId', () => {
  it('espelha o service (slug + sufixo)', () => {
    expect(previewId('Tênis Casual!', new Set())).toBe('tenis-casual')
    expect(previewId('Tênis', new Set(['tenis', 'tenis-2']))).toBe('tenis-3')
    expect(previewId('!!!', new Set())).toBe('item')
  })
})

describe('telefone', () => {
  it('formata progressivamente', () => {
    expect(formatPhone('')).toBe('')
    expect(formatPhone('8')).toBe('(8')
    expect(formatPhone('81')).toBe('(81')
    expect(formatPhone('819')).toBe('(81) 9')
    expect(formatPhone('8133334444')).toBe('(81) 3333-4444')
    expect(formatPhone('81996395100')).toBe('(81) 99639-5100')
    expect(formatPhone('5581996395100')).toBe('+55 (81) 99639-5100')
    expect(formatPhone('08001234567')).toBe('0800 123 4567')
    expect(formatPhone('(81) 9.9639-5100')).toBe('(81) 99639-5100')
  })

  it('valida e gera link tel:', () => {
    expect(isValidPhone('(81) 99639-5100')).toBe(true)
    expect(isValidPhone('(81) 3333-4444')).toBe(true)
    expect(isValidPhone('(81) 9963')).toBe(false)
    expect(isValidPhone('0800 123 4567')).toBe(true)
    expect(phoneHref('(81) 99639-5100')).toBe('tel:+5581996395100')
    expect(phoneHref('+55 (81) 99639-5100')).toBe('tel:+5581996395100')
  })

  it('reposiciona o cursor após o n-ésimo dígito', () => {
    expect(caretAfterDigits('(81) 99639-5100', 2)).toBe(3)
    expect(caretAfterDigits('(81) 99639-5100', 7)).toBe(10)
    expect(caretAfterDigits('(81) 99639-5100', 0)).toBe(1)
  })
})

describe('e-mail e site', () => {
  it('valida e-mail', () => {
    expect(isValidEmail('contato@marca.com.br')).toBe(true)
    expect(isValidEmail('contato@marca')).toBe(false)
    expect(isValidEmail('contato marca@x.com')).toBe(false)
  })

  it('normaliza site sem protocolo', () => {
    expect(normalizeWebsite('marca.com.br')).toBe('https://marca.com.br')
    expect(normalizeWebsite('www.Marca.com.br/loja/')).toBe('https://www.marca.com.br/loja/')
    expect(normalizeWebsite('http://marca.com')).toBe('http://marca.com')
    expect(displayWebsite('https://www.marca.com.br/')).toBe('www.marca.com.br')
    expect(isValidWebsite('marca.com.br')).toBe(true)
    expect(isValidWebsite('marca')).toBe(false)
    expect(isValidWebsite('marca com.br')).toBe(false)
    expect(isValidWebsite('ftp://marca.com')).toBe(false)
  })
})

describe('formulários', () => {
  it('distribuidor: valida e gera payload normalizado', () => {
    expect(distributorForm.validateExtra({ phone: '(81) 9', email: 'x', website: 'abc' })).toEqual({
      phone: expect.any(String),
      email: expect.any(String),
      website: expect.any(String),
    })
    expect(
      distributorForm.toInput({
        name: '  Pegada ',
        description: '',
        phone: '81996395100',
        email: 'Contato@Pegada.com.br ',
        website: 'pegada.com.br',
      }),
    ).toEqual({
      name: 'Pegada',
      description: undefined,
      phone: '(81) 99639-5100',
      email: 'contato@pegada.com.br',
      website: 'https://pegada.com.br',
    })
  })

  it('categoria: imagem vazia vira undefined (remove a capa)', () => {
    expect(categoryForm.toInput({ name: 'Bolsas', description: ' Couro ', image: '' })).toEqual({
      name: 'Bolsas',
      description: 'Couro',
      image: undefined,
    })
  })
})

describe('diversos', () => {
  it('iniciais e links', () => {
    expect(initials('Coca-Cola Shoes')).toBe('CS')
    expect(initials('pegada')).toBe('P')
    expect(storeHref('categories', 'tenis')).toBe('/catalogo?categoria=tenis')
    expect(storeHref('distributors', 'pegada')).toBe('/catalogo?distribuidor=pegada')
    expect(adminProductsHref('categories', 'tenis')).toBe('/admin/produtos?categoria=tenis')
    expect(adminProductsHref('distributors', 'coca-cola-shoes')).toBe('/admin/produtos?distribuidor=coca-cola-shoes')
    expect(
      contactLinks({ name: 'Pegada', phone: '81996395100', email: 'a@b.com', website: 'b.com' }).map((c) => c.href),
    ).toEqual(['tel:+5581996395100', 'mailto:a@b.com', 'https://b.com'])
  })
})
