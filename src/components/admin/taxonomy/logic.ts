/**
 * Lógica pura do gerenciador de taxonomias: busca/ordenação, prévia do
 * identificador, máscara de telefone e normalização de contatos.
 */
import { catalogHref } from '@/lib/catalog-params'
import { normalizeText, slugify } from '@/lib/utils'
import type { Distributor } from '@/types/catalog'
import type { TaxonomyEntityBase, TaxonomyKind, TaxonomySort } from './types'

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })

function time(iso: string): number {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? 0 : t
}

export interface FilterSortOptions<T> {
  query: string
  sort: TaxonomySort
  usage: Record<string, number>
  /** texto extra considerado na busca (ex: contatos do distribuidor) */
  searchText?: (item: T) => string
}

/** Filtra (todas as palavras, sem acento/caixa) e ordena a listagem. */
export function filterAndSortTaxonomy<T extends TaxonomyEntityBase>(
  items: readonly T[],
  { query, sort, usage, searchText }: FilterSortOptions<T>,
): T[] {
  const terms = normalizeText(query).split(' ').filter(Boolean)
  const result = terms.length
    ? items.filter((item) => {
        const haystack = normalizeText(`${item.name} ${item.description ?? ''} ${item.id} ${searchText?.(item) ?? ''}`)
        return terms.every((term) => haystack.includes(term))
      })
    : [...items]

  const byName = (a: T, b: T) => collator.compare(a.name, b.name)
  switch (sort) {
    case 'usage':
      return result.sort((a, b) => (usage[b.id] ?? 0) - (usage[a.id] ?? 0) || byName(a, b))
    case 'recent':
      return result.sort((a, b) => time(b.createdAt) - time(a.createdAt) || byName(a, b))
    default:
      return result.sort(byName)
  }
}

/** Mesmo algoritmo do service: slug do nome + sufixo numérico se já existir. */
export function previewId(name: string, taken: ReadonlySet<string>): string {
  const base = slugify(name) || 'item'
  let id = base
  let i = 2
  while (taken.has(id)) id = `${base}-${i++}`
  return id
}

export function hasDuplicateName(name: string, items: readonly TaxonomyEntityBase[], ignoreId?: string): boolean {
  const n = normalizeText(name)
  return items.some((item) => item.id !== ignoreId && normalizeText(item.name) === n)
}

/** Link da vitrine filtrada por este item. */
export function storeHref(kind: TaxonomyKind, id: string): string {
  return catalogHref(kind === 'categories' ? { categories: [id] } : { distributors: [id] })
}

/** Lista de produtos do painel já filtrada por este item (contrato de /admin/produtos). */
export function adminProductsHref(kind: TaxonomyKind, id: string): string {
  const params = new URLSearchParams({ [kind === 'categories' ? 'categoria' : 'distribuidor']: id })
  return `/admin/produtos?${params.toString()}`
}

/** id estável de DOM para rolar/destacar um item da listagem. */
export function taxonomyDomId(kind: TaxonomyKind, id: string): string {
  return `taxonomy-${kind}-${id}`
}

export function capitalize(value: string): string {
  return value ? value[0].toLocaleUpperCase('pt-BR') + value.slice(1) : value
}

/** "Coca-Cola Shoes" → "CS"; "Pegada" → "P" */
export function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0][0].toLocaleUpperCase('pt-BR')
  return (words[0][0] + words[words.length - 1][0]).toLocaleUpperCase('pt-BR')
}

// ------------------------------------------------------------------ telefone

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Máscara leve brasileira, aplicada enquanto se digita:
 * (81) 3333-4444 · (81) 99639-5100 · +55 (81) 99639-5100 · 0800 123 4567
 */
export function formatPhone(value: string): string {
  let d = onlyDigits(value)
  if (!d) return ''
  if (d.startsWith('0800')) {
    d = d.slice(0, 11)
    return [d.slice(0, 4), d.slice(4, 7), d.slice(7)].filter(Boolean).join(' ')
  }
  let prefix = ''
  if (d.length > 11 && d.startsWith('55')) {
    prefix = '+55 '
    d = d.slice(2)
  }
  d = d.slice(0, 11)
  if (d.length <= 2) return `${prefix}(${d}`
  const ddd = d.slice(0, 2)
  const rest = d.slice(2)
  if (rest.length <= 4) return `${prefix}(${ddd}) ${rest}`
  // celular (9 dígitos) → 5+4; fixo/digitando → 4+resto
  const split = rest.length === 9 ? 5 : 4
  return `${prefix}(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`
}

/** Posição do cursor logo após o n-ésimo dígito de um texto formatado. */
export function caretAfterDigits(formatted: string, digitCount: number): number {
  if (digitCount <= 0) {
    const first = formatted.search(/\d/)
    return first === -1 ? formatted.length : first
  }
  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      seen++
      if (seen === digitCount) return i + 1
    }
  }
  return formatted.length
}

export function isValidPhone(value: string): boolean {
  const d = onlyDigits(value)
  if (d.startsWith('0800')) return d.length === 11
  if (d.length > 11 && d.startsWith('55')) return d.length === 12 || d.length === 13
  return (d.length === 10 || d.length === 11) && d[0] !== '0'
}

export function phoneHref(value: string): string {
  const d = onlyDigits(value)
  if (d.startsWith('0800')) return `tel:${d}`
  if (d.length > 11 && d.startsWith('55')) return `tel:+${d}`
  if (d.length === 10 || d.length === 11) return `tel:+55${d}`
  return `tel:${d}`
}

// ------------------------------------------------------------------ e-mail e site

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[a-z]{2,}$/i

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

/** Aceita "marca.com.br", "www.marca.com.br/loja" ou URL completa → "https://marca.com.br/loja" */
export function normalizeWebsite(value: string): string {
  const v = value.trim()
  if (!v) return ''
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(v) ? v : `https://${v.replace(/^\/+/, '')}`
  try {
    const url = new URL(withProtocol)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return v
    const path = url.pathname === '/' ? '' : url.pathname
    return `${url.protocol}//${url.host}${path}${url.search}${url.hash}`
  } catch {
    return v
  }
}

const HOST_RE = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[a-z]{2,}|xn--[a-z0-9-]+)$/i

export function isValidWebsite(value: string): boolean {
  try {
    const url = new URL(normalizeWebsite(value))
    return (url.protocol === 'http:' || url.protocol === 'https:') && HOST_RE.test(url.hostname)
  } catch {
    return false
  }
}

/** "https://www.marca.com.br/" → "www.marca.com.br" */
export function displayWebsite(value: string): string {
  return normalizeWebsite(value)
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '')
}

// ------------------------------------------------------------------ contatos

export type ContactType = 'phone' | 'email' | 'website'

export interface ContactLink {
  type: ContactType
  href: string
  label: string
  /** rótulo completo para leitores de tela */
  ariaLabel: string
  external: boolean
}

export function contactLinks(distributor: Pick<Distributor, 'name' | 'phone' | 'email' | 'website'>): ContactLink[] {
  const links: ContactLink[] = []
  if (distributor.phone) {
    const label = formatPhone(distributor.phone) || distributor.phone
    links.push({
      type: 'phone',
      href: phoneHref(distributor.phone),
      label,
      ariaLabel: `Ligar para ${distributor.name}: ${label}`,
      external: false,
    })
  }
  if (distributor.email) {
    links.push({
      type: 'email',
      href: `mailto:${distributor.email}`,
      label: distributor.email,
      ariaLabel: `Enviar e-mail para ${distributor.name}: ${distributor.email}`,
      external: false,
    })
  }
  if (distributor.website) {
    const label = displayWebsite(distributor.website)
    links.push({
      type: 'website',
      href: normalizeWebsite(distributor.website),
      label,
      ariaLabel: `Abrir site de ${distributor.name}: ${label} (nova aba)`,
      external: true,
    })
  }
  return links
}

/** Texto de contato usado na busca de distribuidores. */
export function distributorSearchText(distributor: Distributor): string {
  return [distributor.phone, onlyDigits(distributor.phone ?? ''), distributor.email, distributor.website]
    .filter(Boolean)
    .join(' ')
}
