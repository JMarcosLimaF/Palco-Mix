import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { NEW_PRODUCT_DAYS } from '@/config/site'
import type { Product } from '@/types/catalog'

/** Combina classes Tailwind resolvendo conflitos. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** 106 → "R$ 106,00" */
export function formatBRL(value: number): string {
  return brl.format(value)
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d)
}

/** Remove acentos, caixa e espaços duplicados — base da busca. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** "Tênis Casual!" → "tenis-casual" */
export function slugify(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Produto com preço "sob consulta" (price = 0): exibe "Sob consulta" e
 * direciona para o WhatsApp. Fica fora de filtros por faixa de preço.
 */
export function isPriceOnRequest(p: Pick<Product, 'price'>): boolean {
  return !(p.price > 0)
}

/** Preço efetivamente cobrado (promocional quando válido). */
export function effectivePrice(p: Pick<Product, 'price' | 'promoPrice'>): number {
  return hasPromo(p) ? (p.promoPrice as number) : p.price
}

export function hasPromo(p: Pick<Product, 'price' | 'promoPrice'>): boolean {
  return p.price > 0 && typeof p.promoPrice === 'number' && p.promoPrice > 0 && p.promoPrice < p.price
}

/** Percentual de desconto arredondado (0 se não houver promoção). */
export function discountPercent(p: Pick<Product, 'price' | 'promoPrice'>): number {
  if (!hasPromo(p)) return 0
  return Math.round((1 - (p.promoPrice as number) / p.price) * 100)
}

export function isNewProduct(p: Pick<Product, 'createdAt'>, now: number = Date.now()): boolean {
  const created = new Date(p.createdAt).getTime()
  if (Number.isNaN(created)) return false
  return now - created <= NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000
}

/** "pm-0012" → "PM-0012" (código exibido ao cliente). */
export function productCode(id: string): string {
  return id.toUpperCase()
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count.toLocaleString('pt-BR')} ${count === 1 ? singular : plural}`
}
