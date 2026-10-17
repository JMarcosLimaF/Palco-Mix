/**
 * Modelo do formulário de produto (puro, sem React): valores, validação,
 * conversão para `ProductInput` e prévia.
 */
import { isPriceOnRequest, normalizeText } from '@/lib/utils'
import type { Gender, Product, ProductInput, ProductStatus } from '@/types/catalog'
import { formatPriceInput, isBlankPrice, isValidPrice, parsePrice } from './parse-price'

export interface ProductFormValues {
  name: string
  description: string
  /** preço "sob consulta" (salvo como price = 0) */
  priceOnRequest: boolean
  /** texto digitado (ex.: "1.299,90") — ignorado quando sob consulta */
  price: string
  promoPrice: string
  category: string
  distributor: string
  gender: Gender | ''
  sizes: string
  colors: string[]
  tags: string[]
  images: string[]
  status: ProductStatus
  isFeatured: boolean
}

export type ProductFormField = 'name' | 'price' | 'promoPrice' | 'category' | 'distributor'
export type ProductFormErrors = Partial<Record<ProductFormField, string>>

/** Ordem visual dos campos validados (foco no 1º inválido). */
export const VALIDATED_FIELDS: ProductFormField[] = ['name', 'price', 'promoPrice', 'category', 'distributor']

export const NAME_MAX = 120
export const DESCRIPTION_MAX = 2000

export const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: 'feminino', label: 'Feminino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'infantil', label: 'Infantil' },
  { value: 'unissex', label: 'Unissex' },
]

export function valuesFromProduct(product?: Product | null): ProductFormValues {
  if (!product) {
    return {
      name: '',
      description: '',
      priceOnRequest: false,
      price: '',
      promoPrice: '',
      category: '',
      distributor: '',
      gender: '',
      sizes: '',
      colors: [],
      tags: [],
      images: [],
      status: 'active',
      isFeatured: false,
    }
  }
  const onRequest = isPriceOnRequest(product)
  return {
    name: product.name,
    description: product.description ?? '',
    priceOnRequest: onRequest,
    price: onRequest ? '' : formatPriceInput(product.price),
    promoPrice: onRequest ? '' : formatPriceInput(product.promoPrice),
    category: product.category,
    distributor: product.distributor,
    gender: product.gender ?? '',
    sizes: product.sizes ?? '',
    colors: product.colors ?? [],
    tags: product.tags ?? [],
    images: product.images ?? [],
    status: product.status,
    isFeatured: product.isFeatured,
  }
}

export function validateProductForm(values: ProductFormValues): ProductFormErrors {
  const errors: ProductFormErrors = {}
  const name = values.name.trim()
  if (!name) errors.name = 'Informe o nome do produto.'
  else if (name.length < 2) errors.name = 'O nome precisa de pelo menos 2 caracteres.'

  if (!values.priceOnRequest) {
    const price = parsePrice(values.price)
    if (isBlankPrice(values.price)) errors.price = 'Informe o preço (ou marque "sob consulta").'
    else if (!isValidPrice(price)) errors.price = 'Preço inválido. Use o formato 106,00.'

    if (!isBlankPrice(values.promoPrice)) {
      const promo = parsePrice(values.promoPrice)
      if (!isValidPrice(promo)) errors.promoPrice = 'Preço promocional inválido. Use o formato 99,90.'
      else if (isValidPrice(price) && promo >= price) errors.promoPrice = 'Deve ser menor que o preço normal.'
    }
  }

  if (!values.category) errors.category = 'Selecione uma categoria.'
  if (!values.distributor) errors.distributor = 'Selecione um distribuidor.'
  return errors
}

export function hasErrors(errors: ProductFormErrors): boolean {
  return VALIDATED_FIELDS.some((f) => Boolean(errors[f]))
}

/** Converte os valores (já validados) para a entrada do service; opcionais vazios viram undefined. */
export function toProductInput(values: ProductFormValues): ProductInput {
  const price = parsePrice(values.price)
  const promo = parsePrice(values.promoPrice)
  const onRequest = values.priceOnRequest
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    // 0 = "sob consulta"
    price: onRequest || !isValidPrice(price) ? 0 : price,
    promoPrice: !onRequest && isValidPrice(promo) ? promo : undefined,
    category: values.category,
    distributor: values.distributor,
    images: values.images,
    isFeatured: values.isFeatured,
    status: values.status,
    sizes: values.sizes.trim() || undefined,
    colors: values.colors.length ? values.colors : undefined,
    gender: values.gender || undefined,
    tags: values.tags.length ? values.tags : undefined,
  }
}

/** Representação estável para detectar alterações não salvas. */
export function snapshotValues(values: ProductFormValues): string {
  const price = parsePrice(values.price)
  const promo = parsePrice(values.promoPrice)
  const onRequest = values.priceOnRequest
  return JSON.stringify({
    ...values,
    name: values.name.trim(),
    description: values.description.trim(),
    sizes: values.sizes.trim(),
    // sob consulta: o que estiver digitado nos campos de preço não conta
    price: onRequest ? 0 : price === undefined || Number.isNaN(price) ? values.price.trim() : price,
    promoPrice: onRequest ? '' : promo === undefined || Number.isNaN(promo) ? values.promoPrice.trim() : promo,
  })
}

/** Produto "de mentira" montado com os valores atuais, para a prévia do card. */
export function buildPreviewProduct(
  values: ProductFormValues,
  base: { id: string; createdAt: string },
): Product {
  const price = parsePrice(values.price)
  const promo = parsePrice(values.promoPrice)
  const validPrice = !values.priceOnRequest && isValidPrice(price) ? price : 0
  return {
    id: base.id,
    createdAt: base.createdAt,
    name: values.name.trim() || 'Nome do produto',
    description: values.description,
    price: validPrice,
    promoPrice: validPrice > 0 && isValidPrice(promo) && promo < validPrice ? promo : undefined,
    category: values.category,
    distributor: values.distributor,
    images: values.images,
    isFeatured: values.isFeatured,
    status: values.status,
  }
}

/** Valores mais usados no catálogo (sugestões de cores/tags), sem repetir os já escolhidos. */
export function topValues(lists: Array<string[] | undefined>, exclude: string[], limit = 8): string[] {
  const excluded = new Set(exclude.map(normalizeText))
  const counts = new Map<string, { label: string; count: number }>()
  for (const list of lists) {
    for (const raw of list ?? []) {
      const label = raw.trim()
      const key = normalizeText(label)
      if (!key || excluded.has(key)) continue
      const entry = counts.get(key)
      if (entry) entry.count++
      else counts.set(key, { label, count: 1 })
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'))
    .slice(0, limit)
    .map((e) => e.label)
}

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i

/**
 * Normaliza o caminho/URL informado manualmente.
 * "foto.jpg" → "/produtos/foto.jpg" · "produtos/x.jpg" → "/produtos/x.jpg"
 */
export function normalizeImagePath(raw: string): string {
  const value = raw.trim()
  if (!value || /^https?:\/\//i.test(value) || value.startsWith('/')) return value
  if (value.startsWith('produtos/')) return `/${value}`
  if (!value.includes('/')) return `/produtos/${value}`
  return `/${value}`
}

/** Mensagem de erro de formato, ou null quando o caminho é aceitável. */
export function imagePathError(path: string): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) {
    let url: URL
    try {
      url = new URL(path)
    } catch {
      return 'URL inválida.'
    }
    if (url.protocol !== 'https:') return 'Use uma URL segura (https://).'
    return IMAGE_EXT.test(url.pathname) ? null : 'A URL deve terminar em .jpg, .png, .webp ou .avif.'
  }
  if (!path.startsWith('/')) return 'O caminho deve começar com /produtos/.'
  if (/\s/.test(path) || path.includes('..')) return 'Caminho inválido (sem espaços nem "..").'
  return IMAGE_EXT.test(path) ? null : 'O arquivo deve ser .jpg, .png, .webp ou .avif.'
}
