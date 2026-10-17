import { describe, expect, it } from 'vitest'
import { formatPriceInput, isValidPrice, parsePrice, sanitizePriceTyping } from './parse-price'
import {
  buildPreviewProduct,
  imagePathError,
  normalizeImagePath,
  snapshotValues,
  toProductInput,
  topValues,
  validateProductForm,
  valuesFromProduct,
} from './product-form-model'
import {
  adminFiltersToQuery,
  applyAdminFiltersPatch,
  clearAdminFilters,
  countAdminFilters,
  parseAdminProductParams,
  toAdminProductParams,
} from './products-params'

describe('parsePrice', () => {
  it.each([
    ['106', 106],
    ['106,00', 106],
    ['106.00', 106],
    ['1.299,90', 1299.9],
    ['1,299.90', 1299.9],
    ['1299,9', 1299.9],
    ['R$ 89,90', 89.9],
    ['1.299', 1299],
    ['59,9', 59.9],
    ['106,', 106],
    [',50', 0.5],
    ['10,555', 10.56],
  ])('%s → %d', (raw, expected) => {
    expect(parsePrice(raw)).toBe(expected)
  })

  it('vazio → undefined; inválido → NaN', () => {
    expect(parsePrice('')).toBeUndefined()
    expect(parsePrice('  R$ ')).toBeUndefined()
    expect(parsePrice('abc')).toBeNaN()
    expect(parsePrice('1,2,3')).toBeNaN()
    expect(parsePrice('1.2.3')).toBeNaN()
  })

  it('valida, formata e higieniza', () => {
    expect(isValidPrice(0)).toBe(false)
    expect(isValidPrice(Number.NaN)).toBe(false)
    expect(isValidPrice(1)).toBe(true)
    expect(formatPriceInput(1299.9)).toBe('1.299,90')
    expect(formatPriceInput(undefined)).toBe('')
    expect(sanitizePriceTyping('R$ 1.299,90a')).toBe('1.299,90')
  })
})

describe('URL da listagem do admin', () => {
  it('lê e escreve os parâmetros em pt-BR', () => {
    const f = parseAdminProductParams(
      new URLSearchParams('q=chinelo&status=inativos&categoria=chinelos&distribuidor=pegada&destaque=1&promo=1&ordem=menor-preco&pagina=3&porPagina=50'),
    )
    expect(f).toEqual({
      search: 'chinelo',
      status: 'inactive',
      category: 'chinelos',
      distributor: 'pegada',
      featured: true,
      onSale: true,
      sort: 'price-asc',
      page: 3,
      pageSize: 50,
    })
    expect(toAdminProductParams(f).toString()).toBe(
      'q=chinelo&status=inativos&categoria=chinelos&distribuidor=pegada&destaque=1&promo=1&ordem=menor-preco&pagina=3&porPagina=50',
    )
    expect(countAdminFilters(f)).toBe(5)
  })

  it('padrões e valores inválidos', () => {
    const f = parseAdminProductParams(new URLSearchParams('status=xx&porPagina=7&pagina=-2&ordem=zzz'))
    expect(f.status).toBe('all')
    expect(f.pageSize).toBe(25)
    expect(f.page).toBe(1)
    expect(f.sort).toBeUndefined()
    expect(toAdminProductParams(f).toString()).toBe('')
  })

  it('trocar filtro volta para a página 1; patch sem mudança mantém a página', () => {
    const current = new URLSearchParams('q=tenis&pagina=4')
    expect(applyAdminFiltersPatch(current, { status: 'active' }).get('pagina')).toBeNull()
    expect(applyAdminFiltersPatch(current, { search: 'tenis ' }).get('pagina')).toBe('4')
    expect(applyAdminFiltersPatch(current, { page: 2 }).get('pagina')).toBe('2')
  })

  it('limpar mantém itens por página', () => {
    expect(clearAdminFilters(new URLSearchParams('q=a&destaque=1&porPagina=100&pagina=2')).toString()).toBe('porPagina=100')
  })

  it('converte para ProductQuery do motor', () => {
    expect(adminFiltersToQuery(parseAdminProductParams(new URLSearchParams('categoria=tenis')))).toMatchObject({
      status: 'all',
      categories: ['tenis'],
      search: undefined,
      featured: undefined,
      page: 1,
      pageSize: 25,
    })
  })
})

describe('modelo do formulário', () => {
  const base = valuesFromProduct(null)

  it('novo produto: ativo e sem destaque por padrão', () => {
    expect(base.status).toBe('active')
    expect(base.isFeatured).toBe(false)
  })

  it('valida obrigatórios e promoção', () => {
    expect(Object.keys(validateProductForm(base)).sort()).toEqual(['category', 'distributor', 'name', 'price'])
    const filled = { ...base, name: 'Tênis X', price: '100,00', category: 'tenis', distributor: 'pegada' }
    expect(validateProductForm(filled)).toEqual({})
    expect(validateProductForm({ ...filled, promoPrice: '100' }).promoPrice).toBeTruthy()
    expect(validateProductForm({ ...filled, promoPrice: '0' }).promoPrice).toBeTruthy()
    expect(validateProductForm({ ...filled, price: '0' }).price).toBeTruthy()
    expect(validateProductForm({ ...filled, promoPrice: '89,90' })).toEqual({})
  })

  it('sob consulta: salva preço 0, sem promoção, e não valida os campos de preço', () => {
    const filled = { ...base, name: 'Chinelo', category: 'c', distributor: 'd', priceOnRequest: true, promoPrice: '9' }
    expect(validateProductForm(filled)).toEqual({})
    expect(toProductInput(filled)).toMatchObject({ price: 0, promoPrice: undefined })
    expect(buildPreviewProduct({ ...filled, price: '50' }, { id: 'x', createdAt: '2026-01-01' }).price).toBe(0)
    // o que estiver digitado não conta como alteração enquanto sob consulta
    expect(snapshotValues({ ...filled, price: '50' })).toBe(snapshotValues({ ...filled, price: '' }))
  })

  it('carrega produto existente sob consulta', () => {
    const v = valuesFromProduct({
      id: 'pm-1',
      name: 'X',
      description: '',
      price: 0,
      category: 'c',
      distributor: 'd',
      images: [],
      isFeatured: false,
      status: 'active',
      createdAt: '2026-01-01',
    })
    expect(v.priceOnRequest).toBe(true)
    expect(v.price).toBe('')
  })

  it('opcionais vazios viram undefined', () => {
    const input = toProductInput({ ...base, name: ' Tênis ', price: '1.299,90', category: 'c', distributor: 'd' })
    expect(input).toMatchObject({ name: 'Tênis', price: 1299.9, status: 'active', isFeatured: false })
    expect(input.promoPrice).toBeUndefined()
    expect(input.sizes).toBeUndefined()
    expect(input.colors).toBeUndefined()
    expect(input.gender).toBeUndefined()
    expect(input.tags).toBeUndefined()
  })

  it('snapshot ignora diferenças só de formatação do preço', () => {
    expect(snapshotValues({ ...base, price: '106' })).toBe(snapshotValues({ ...base, price: '106,00' }))
    expect(snapshotValues({ ...base, price: '106' })).not.toBe(snapshotValues({ ...base, price: '107' }))
  })

  it('prévia usa promoção só quando válida', () => {
    const p = buildPreviewProduct({ ...base, price: '110', promoPrice: '120' }, { id: 'x', createdAt: '2026-01-01' })
    expect(p.price).toBe(110)
    expect(p.promoPrice).toBeUndefined()
    expect(p.name).toBe('Nome do produto')
  })

  it('sugestões por frequência, sem repetir as escolhidas', () => {
    expect(topValues([['Preto', 'Branco'], ['preto'], ['Nude']], ['branco'])).toEqual(['Preto', 'Nude'])
  })

  it('caminhos de imagem', () => {
    expect(normalizeImagePath('foto.jpg')).toBe('/produtos/foto.jpg')
    expect(normalizeImagePath('produtos/x.JPG')).toBe('/produtos/x.JPG')
    expect(imagePathError('/produtos/x.JPG')).toBeNull()
    expect(imagePathError('https://cdn.site.com/a.webp?v=2')).toBeNull()
    expect(imagePathError('http://cdn.site.com/a.webp')).toBeTruthy()
    expect(imagePathError('/produtos/x.pdf')).toBeTruthy()
    expect(imagePathError('/produtos/../x.jpg')).toBeTruthy()
  })
})
