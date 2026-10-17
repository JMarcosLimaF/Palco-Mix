/** Utilidades puras da busca do cabeçalho (sem React). */
import { formatBRL, hasPromo, isPriceOnRequest, normalizeText } from '@/lib/utils'
import type { Product } from '@/types/catalog'

export interface HighlightPart {
  text: string
  match: boolean
}

function normalizeChar(char: string): string {
  return char.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function searchTokens(query: string): string[] {
  const tokens = normalizeText(query).split(' ').filter(Boolean)
  const meaningful = tokens.filter((t) => t.length >= 2)
  return meaningful.length ? meaningful : tokens
}

/**
 * Divide `text` em trechos marcando os que casam com os termos buscados,
 * ignorando acentos e caixa ("tenis" destaca "Tênis").
 */
export function highlightParts(text: string, query: string): HighlightPart[] {
  const tokens = searchTokens(query)
  if (!text || tokens.length === 0) return [{ text, match: false }]

  // texto normalizado + mapa (índice normalizado → índice original)
  const chars = Array.from(text)
  let normalized = ''
  const origin: number[] = []
  chars.forEach((char, i) => {
    const n = normalizeChar(char)
    normalized += n
    for (let k = 0; k < n.length; k++) origin.push(i)
  })

  const mask = new Array<boolean>(chars.length).fill(false)
  for (const token of tokens) {
    let from = normalized.indexOf(token)
    while (from !== -1) {
      const start = origin[from]
      const end = origin[from + token.length - 1]
      for (let i = start; i <= end; i++) mask[i] = true
      from = normalized.indexOf(token, from + token.length)
    }
  }
  // marcas combinantes soltas acompanham o caractere anterior
  chars.forEach((char, i) => {
    if (i > 0 && normalizeChar(char) === '') mask[i] = mask[i - 1]
  })

  const parts: HighlightPart[] = []
  chars.forEach((char, i) => {
    const last = parts.at(-1)
    if (last && last.match === mask[i]) last.text += char
    else parts.push({ text: char, match: mask[i] })
  })
  return parts
}

const compact = (value: string) => value.replace(/[^a-z0-9]/g, '')

/**
 * Nome de categoria/distribuidor casa com o termo?
 * Frase contida, forma compacta ("dcalce" → "D'Calce") ou início de palavra.
 */
export function nameMatches(name: string, term: string): boolean {
  const n = normalizeText(name)
  const q = normalizeText(term)
  if (!q) return false
  if (n.includes(q)) return true
  const cq = compact(q)
  if (cq.length >= 3 && compact(n).includes(cq)) return true
  const words = n.split(/[^a-z0-9]+/).filter(Boolean)
  return q.split(' ').some((t) => t.length >= 3 && words.some((w) => w.startsWith(t)))
}

/** Relevância simples para ordenar nomes que casam (prefixo antes de "contém"). */
export function nameScore(name: string, term: string): number {
  const n = normalizeText(name)
  const q = normalizeText(term)
  if (n === q) return 3
  if (n.startsWith(q)) return 2
  if (n.includes(q)) return 1
  return 0
}

/**
 * Preço de uma sugestão de produto:
 * price 0 → "Sob consulta"; promoPrice válido → à vista (desconto) + a prazo; senão, preço único.
 */
export type SuggestionPrice =
  | { kind: 'on-request' }
  | { kind: 'single'; value: string }
  | { kind: 'cash'; cash: string; installment: string }

export function suggestionPrice(product: Pick<Product, 'price' | 'promoPrice'>): SuggestionPrice {
  if (isPriceOnRequest(product)) return { kind: 'on-request' }
  if (hasPromo(product)) {
    return { kind: 'cash', cash: formatBRL(product.promoPrice as number), installment: formatBRL(product.price) }
  }
  return { kind: 'single', value: formatBRL(product.price) }
}

/** id DOM de uma opção da lista de sugestões (aria-activedescendant). */
export function optionDomId(listboxId: string, key: string): string {
  return `${listboxId}-${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`
}

/** Foco em campo editável? (atalhos globais não devem disparar) */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
}

/** Teclado Apple → "⌘K"; demais → "Ctrl K". */
export const IS_APPLE_PLATFORM =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)

export const SEARCH_SHORTCUT_LABEL = IS_APPLE_PLATFORM ? '⌘K' : 'Ctrl K'

/** Clique "simples" (sem modificadores): pode ser interceptado pela SPA. */
export function isPlainLeftClick(event: {
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  defaultPrevented: boolean
}): boolean {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}
