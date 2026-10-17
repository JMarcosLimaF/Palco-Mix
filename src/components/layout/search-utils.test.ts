import { describe, expect, it } from 'vitest'
import { activeNavKey } from './nav-config'
import { highlightParts, isPlainLeftClick, nameMatches, nameScore, optionDomId } from './search-utils'

const marked = (text: string, query: string) =>
  highlightParts(text, query)
    .filter((p) => p.match)
    .map((p) => p.text)

describe('highlightParts', () => {
  it('ignora acentos e caixa preservando o texto original', () => {
    expect(marked('Tênis Casual', 'tenis')).toEqual(['Tênis'])
    expect(marked('Sandália Pegada', 'SANDALIA')).toEqual(['Sandália'])
    expect(highlightParts('Calçados', 'calc').map((p) => p.text).join('')).toBe('Calçados')
  })

  it('marca vários termos e repetições', () => {
    expect(marked('Chinelo Coca-Cola Coca', 'coca chinelo')).toEqual(['Chinelo', 'Coca', 'Coca'])
  })

  it('destaca o código do produto', () => {
    expect(marked('PM-0012', 'pm-0012')).toEqual(['PM-0012'])
  })

  it('sem termo devolve o texto inteiro', () => {
    expect(highlightParts('Rasteirinha', '')).toEqual([{ text: 'Rasteirinha', match: false }])
  })

  it('lida com texto já decomposto (NFD)', () => {
    const nfd = 'Tênis'.normalize('NFD')
    expect(marked(nfd, 'tenis').join('')).toBe(nfd)
  })
})

describe('nameMatches / nameScore', () => {
  it('casa frase, forma compacta e início de palavra', () => {
    expect(nameMatches('Sandálias', 'sandalia')).toBe(true)
    expect(nameMatches("D'Calce", 'dcalce')).toBe(true)
    expect(nameMatches('Coca-Cola Shoes', 'cola')).toBe(true)
    expect(nameMatches('Beira Rio', 'sandalia beira')).toBe(true)
  })

  it('não casa trechos soltos curtos no meio de palavras', () => {
    expect(nameMatches('Rider', 'sandalia de couro')).toBe(false)
    expect(nameMatches('Modare', '')).toBe(false)
  })

  it('prioriza nome exato e prefixo', () => {
    expect(nameScore('Tênis', 'tenis')).toBeGreaterThan(nameScore('Sapatênis', 'tenis'))
    expect(nameScore('Tênis Infantil', 'tenis')).toBeGreaterThan(nameScore('Sapatênis', 'tenis'))
  })
})

describe('activeNavKey', () => {
  it('reconhece as rotas e os filtros da vitrine', () => {
    expect(activeNavKey('/', '')).toBe('inicio')
    expect(activeNavKey('/categorias', '')).toBe('categorias')
    expect(activeNavKey('/distribuidores', '')).toBe('distribuidores')
    expect(activeNavKey('/catalogo', '?destaque=1')).toBe('destaques')
    expect(activeNavKey('/catalogo', '?ordem=recentes')).toBe('lancamentos')
    expect(activeNavKey('/catalogo', '?categoria=tenis')).toBe('categorias')
    expect(activeNavKey('/catalogo', '?distribuidor=pegada')).toBe('distribuidores')
    expect(activeNavKey('/catalogo', '?q=tenis')).toBe('catalogo')
    expect(activeNavKey('/produto/pm-0001', '')).toBeNull()
  })
})

describe('helpers', () => {
  it('gera ids DOM válidos', () => {
    expect(optionDomId('_r_1_', 'p:pm-0001')).toBe('_r_1_-p_pm-0001')
  })

  it('identifica clique simples', () => {
    const base = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false }
    expect(isPlainLeftClick(base)).toBe(true)
    expect(isPlainLeftClick({ ...base, metaKey: true })).toBe(false)
    expect(isPlainLeftClick({ ...base, button: 1 })).toBe(false)
  })
})
