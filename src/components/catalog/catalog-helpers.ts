/**
 * Helpers puros da vitrine (catálogo, visualização rápida e página do produto).
 * Sem React — fáceis de testar e reaproveitar.
 */
import { countActiveFilters } from '@/lib/catalog-params'
import { getImageSources, type ImageSources } from '@/lib/images'
import { formatBRL, normalizeText, productCode } from '@/lib/utils'
import type { Gender, Product, ProductQuery, ProductSort } from '@/types/catalog'

/** `sizes` da grade: 2 col (mobile) · 3 col (sm) · 4 col (xl). */
export const GRID_IMAGE_SIZES = '(min-width: 1280px) 20vw, (min-width: 640px) 30vw, 48vw'

/** `sizes` do carrossel "Você também pode gostar" (rail no mobile, 4 col no desktop). */
export const RAIL_IMAGE_SIZES = '(min-width: 1024px) 22vw, (min-width: 640px) 31vw, 46vw'

/** Miniaturas da galeria: sempre a versão de 400w. */
export const THUMB_IMAGE_SIZES = '80px'

// ------------------------------------------------------------------ imagens

/**
 * Fontes responsivas limitadas às miniaturas WebP (até 800w).
 * O original em alta (300 KB+) só é baixado quando o zoom/visualizador pede.
 */
export function cappedImageSources(path: string | undefined): ImageSources {
  const sources = getImageSources(path)
  if (!sources.srcSet || !path) return sources
  const candidates = sources.srcSet.split(', ').filter((candidate) => !candidate.startsWith(`${path} `))
  return { ...sources, srcSet: candidates.length ? candidates.join(', ') : undefined }
}

/** Pré-carrega a versão da galeria (≤ 800w) — ex.: imagem vizinha do carrossel. */
export function preloadGalleryImage(path: string | undefined, sizes: string) {
  if (!path) return
  const { src, srcSet } = cappedImageSources(path)
  const img = new Image()
  img.decoding = 'async'
  if (srcSet) {
    img.sizes = sizes
    img.srcset = srcSet
  }
  img.src = src
}

// ------------------------------------------------------------------ preços

const brlNoCents = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const plainNumber = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

/** 60 → "R$ 60" · 59.9 → "R$ 59,90" */
export function formatPriceCompact(value: number): string {
  return Number.isInteger(value) ? brlNoCents.format(value) : formatBRL(value)
}

/** Valor exibido nos campos mín./máx.: 60 → "60" · 59.9 → "59,90" */
export function formatPriceInput(value: number | undefined): string {
  if (value === undefined) return ''
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',')
}

/**
 * Lê o texto digitado no campo de preço (aceita vírgula, "R$", milhar com ponto).
 * `undefined` = campo vazio · `null` = valor inválido.
 */
export function parsePriceInput(text: string): number | undefined | null {
  const cleaned = text.replace(/[^\d.,]/g, '')
  if (!cleaned) return text.trim() ? null : undefined
  let normalized = cleaned
  if (cleaned.includes(',')) normalized = cleaned.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) normalized = cleaned.replace(/\./g, '')
  const n = Number(normalized)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100) / 100
}

/** Rótulo de uma faixa de preço (chips ativos e atalhos). */
export function priceRangeLabel(min: number | undefined, max: number | undefined): string {
  if (min !== undefined && max !== undefined) return `${formatPriceCompact(min)} – ${plainNumber.format(max)}`
  if (min !== undefined) return `A partir de ${formatPriceCompact(min)}`
  if (max !== undefined) return `Até ${formatPriceCompact(max)}`
  return 'Qualquer preço'
}

export interface PriceShortcut {
  key: string
  label: string
  min?: number
  max?: number
}

/** Pontos "redondos" usados como cortes dos atalhos de preço. */
const PRICE_LADDER = [
  10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 180, 200, 250, 300, 350, 400, 500, 600, 800, 1000,
  1500, 2000, 3000, 5000,
]

function nearestLadder(target: number): number {
  let best = PRICE_LADDER[0]
  let bestDistance = Number.POSITIVE_INFINITY
  for (const value of PRICE_LADDER) {
    const distance = Math.abs(Math.log(value / target))
    if (distance < bestDistance) {
      best = value
      bestDistance = distance
    }
  }
  return best
}

/**
 * Atalhos de faixa de preço a partir da faixa real dos resultados.
 * Cortes em progressão geométrica (preços de calçados são assimétricos:
 * muitos chinelos baratos, poucos tênis caros) arredondados para valores redondos.
 * Ex.: R$ 12–250 → Até R$ 30 · R$ 30–60 · R$ 60–120 · Acima de R$ 120
 */
export function buildPriceShortcuts(range: { min: number; max: number } | undefined): PriceShortcut[] {
  if (!range) return []
  const { min, max } = range
  if (!(max > 0) || max - min < 10) return []
  // piso robusto: produtos sem preço (0) não podem achatar os cortes
  const low = Math.max(min, max / 16, 1)
  const ratio = max / low
  if (ratio < 1.2) return []
  const cuts: number[] = []
  for (const k of [1, 2, 3]) {
    const cut = nearestLadder(low * Math.pow(ratio, k / 4))
    const last = cuts.at(-1)
    if (cut > min && cut < max && (last === undefined || cut > last)) cuts.push(cut)
  }
  if (cuts.length === 0) return []

  const shortcuts: PriceShortcut[] = [{ key: `ate-${cuts[0]}`, label: `Até ${formatPriceCompact(cuts[0])}`, max: cuts[0] }]
  for (let i = 1; i < cuts.length; i++) {
    shortcuts.push({
      key: `${cuts[i - 1]}-${cuts[i]}`,
      label: `${formatPriceCompact(cuts[i - 1])} – ${plainNumber.format(cuts[i])}`,
      min: cuts[i - 1],
      max: cuts[i],
    })
  }
  const top = cuts[cuts.length - 1]
  shortcuts.push({ key: `acima-${top}`, label: `Acima de ${formatPriceCompact(top)}`, min: top })
  return shortcuts
}

// ------------------------------------------------------------------ ordenação

/** Ordenação efetiva exibida no seletor (mesma regra do motor de busca). */
export function effectiveSort(query: ProductQuery): ProductSort {
  const hasSearch = Boolean(query.search?.trim())
  if (!query.sort) return hasSearch ? 'relevance' : 'recent'
  if (query.sort === 'relevance' && !hasSearch) return 'recent'
  return query.sort
}

export function defaultSort(query: ProductQuery): ProductSort {
  return query.search?.trim() ? 'relevance' : 'recent'
}

// ------------------------------------------------------------------ títulos e chips

interface NameLookups {
  categoryById: Map<string, { name: string }>
  distributorById: Map<string, { name: string }>
}

/** Título contextual da vitrine (h1 + <title>). */
export function catalogTitle(query: ProductQuery, lookups: NameLookups): string {
  const search = query.search?.trim()
  if (search) return `Resultados para “${search}”`
  if (query.categories?.length === 1) {
    const name = lookups.categoryById.get(query.categories[0])?.name
    if (name) return name
  }
  if (query.distributors?.length === 1 && !query.categories?.length) {
    const name = lookups.distributorById.get(query.distributors[0])?.name
    if (name) return name
  }
  if (query.featured) return 'Em destaque'
  if (query.onSale) return 'Em promoção'
  if (query.sort === 'recent' && countActiveFilters(query) === 0) return 'Lançamentos'
  return 'Catálogo'
}

export interface ActiveFilterChip {
  key: string
  label: string
  /** patch que remove este filtro */
  patch: Partial<ProductQuery>
}

/** Chips removíveis dos filtros ativos (inclui a busca). */
export function buildActiveFilterChips(query: ProductQuery, lookups: NameLookups): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []
  const search = query.search?.trim()
  if (search) chips.push({ key: 'q', label: `“${search}”`, patch: { search: undefined } })
  for (const id of query.categories ?? []) {
    chips.push({
      key: `c:${id}`,
      label: lookups.categoryById.get(id)?.name ?? id,
      patch: { categories: query.categories?.filter((c) => c !== id) },
    })
  }
  for (const id of query.distributors ?? []) {
    chips.push({
      key: `d:${id}`,
      label: lookups.distributorById.get(id)?.name ?? id,
      patch: { distributors: query.distributors?.filter((d) => d !== id) },
    })
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    chips.push({
      key: 'price',
      label: priceRangeLabel(query.minPrice, query.maxPrice),
      patch: { minPrice: undefined, maxPrice: undefined },
    })
  }
  if (query.featured) chips.push({ key: 'featured', label: 'Destaques', patch: { featured: undefined } })
  if (query.onSale) chips.push({ key: 'promo', label: 'Em promoção', patch: { onSale: undefined } })
  return chips
}

// ------------------------------------------------------------------ produto

export type SizeOptions = { kind: 'list'; options: string[]; text: string } | { kind: 'text'; text: string }

const PAIR_RANGE = /(\d{1,2})\s*\/\s*(\d{1,2})\s*(?:ao|a|até|-|–)\s*(\d{1,2})\s*\/\s*(\d{1,2})/i
const SIMPLE_RANGE = /(\d+)\s*(ao|a|\/|-|–)\s*(\d+)/i
const SIZE_LIST = /^\s*\d{1,2}(?:\s*[,;]\s*\d{1,2})+\s*$/

/**
 * Numeração → opções selecionáveis.
 * "34 ao 39" → 34…39 · "33/34 ao 39/40" → 33/34, 35/36, 37/38, 39/40 · "35, 36, 37" → lista.
 * Qualquer outro formato é exibido como texto.
 */
export function parseSizeOptions(sizes: string | undefined): SizeOptions | null {
  const text = sizes?.trim()
  if (!text) return null

  const pair = PAIR_RANGE.exec(text)
  if (pair) {
    const [a, b, c, d] = pair.slice(1, 5).map(Number)
    if (b === a + 1 && d === c + 1 && c > a && (c - a) % 2 === 0 && c - a <= 24) {
      const options: string[] = []
      for (let n = a; n <= c; n += 2) options.push(`${n}/${n + 1}`)
      return { kind: 'list', options, text }
    }
  }

  if (SIZE_LIST.test(text)) {
    const options = Array.from(new Set(text.split(/[,;]/).map((s) => s.trim()))).sort((x, y) => Number(x) - Number(y))
    return { kind: 'list', options, text }
  }

  const range = SIMPLE_RANGE.exec(text)
  if (range) {
    const from = Number(range[1])
    const to = Number(range[3])
    if (from > 0 && to > from && to - from <= 20 && to <= 50) {
      const options: string[] = []
      for (let n = from; n <= to; n++) options.push(String(n))
      return { kind: 'list', options, text }
    }
  }

  return { kind: 'text', text }
}

/** Mensagem pré-preenchida do WhatsApp para um produto (com a numeração escolhida). */
export function productWhatsappMessage(product: Pick<Product, 'id' | 'name'>, size?: string | null): string {
  return `Olá! Tenho interesse no produto *${product.name}* (código ${productCode(product.id)})${
    size ? `, numeração ${size}` : ''
  }. Ainda tem disponível?`
}

export const GENDER_LABEL: Record<Gender, string> = {
  feminino: 'Feminino',
  masculino: 'Masculino',
  infantil: 'Infantil',
  unissex: 'Unissex',
}

const COLOR_SWATCHES: Record<string, string> = {
  preto: '#111111',
  preta: '#111111',
  branco: '#ffffff',
  branca: '#ffffff',
  'off white': '#f3efe6',
  'off-white': '#f3efe6',
  offwhite: '#f3efe6',
  gelo: '#eef1f4',
  creme: '#f1e6cf',
  bege: '#d9c4a3',
  areia: '#d8c3a0',
  nude: '#e2b99a',
  caramelo: '#b5732f',
  camel: '#b5803f',
  marrom: '#5b3a29',
  cafe: '#4b2e1f',
  chocolate: '#3f2418',
  conhaque: '#8a4b23',
  whisky: '#9a5a2a',
  azul: '#2563eb',
  'azul marinho': '#1e2a4a',
  marinho: '#1e2a4a',
  jeans: '#3b5b85',
  'azul claro': '#7cb4f0',
  vermelho: '#dc2626',
  vermelha: '#dc2626',
  vinho: '#7a1f2b',
  bordo: '#6d1a2b',
  rosa: '#f472b6',
  pink: '#ec4899',
  'rosa claro': '#f9c4d8',
  lilas: '#c4a1e0',
  roxo: '#7c3aed',
  verde: '#16a34a',
  'verde militar': '#4b5320',
  militar: '#4b5320',
  oliva: '#6b7a3a',
  amarelo: '#facc15',
  mostarda: '#d4a017',
  laranja: '#f97316',
  coral: '#f87171',
  salmao: '#fa8072',
  cinza: '#9ca3af',
  grafite: '#3f3f46',
  chumbo: '#4b4f56',
  prata: '#c4c6cc',
  dourado: '#d4af37',
  ouro: '#d4af37',
  bronze: '#a46a3c',
  cobre: '#b8733e',
}

/** Cores de amostra para um nome de cor ("Preto/Branco" → duas amostras). */
export function colorSwatches(name: string): string[] {
  const parts = normalizeText(name)
    .split(/\s*(?:\/|\+|&|,|\se\s)\s*/)
    .filter(Boolean)
  const swatches: string[] = []
  for (const part of parts.slice(0, 3)) {
    const hex = COLOR_SWATCHES[part] ?? COLOR_SWATCHES[part.split(' ')[0]]
    if (hex) swatches.push(hex)
  }
  return swatches
}
