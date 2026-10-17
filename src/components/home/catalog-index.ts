/**
 * Índice dos produtos ATIVOS agrupados por categoria e por marca
 * (mais recentes primeiro). Base das contagens e miniaturas da Home,
 * de /categorias e de /distribuidores.
 */
import { useMemo } from 'react'
import { useProducts } from '@/hooks/catalog'
import type { Product } from '@/types/catalog'

export interface ActiveCatalogIndex {
  total: number
  byCategory: ReadonlyMap<string, readonly Product[]>
  byDistributor: ReadonlyMap<string, readonly Product[]>
}

/** Ordenação de nomes em pt-BR (ignora acento/caixa). */
export const nameCollator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })

export const NO_PRODUCTS: readonly Product[] = []

// o mesmo array de produtos (cache do TanStack Query) gera o índice uma única vez
const cache = new WeakMap<readonly Product[], ActiveCatalogIndex>()

function push(map: Map<string, Product[]>, key: string, product: Product) {
  const list = map.get(key)
  if (list) list.push(product)
  else map.set(key, [product])
}

export function buildCatalogIndex(products: readonly Product[]): ActiveCatalogIndex {
  const cached = cache.get(products)
  if (cached) return cached

  const sorted = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const byCategory = new Map<string, Product[]>()
  const byDistributor = new Map<string, Product[]>()
  for (const product of sorted) {
    push(byCategory, product.category, product)
    push(byDistributor, product.distributor, product)
  }
  const index: ActiveCatalogIndex = { total: sorted.length, byCategory, byDistributor }
  cache.set(products, index)
  return index
}

export function useActiveCatalogIndex() {
  const query = useProducts()
  const data = query.data
  const index = useMemo(() => buildCatalogIndex(data ?? NO_PRODUCTS), [data])
  return { ...index, isLoading: query.isPending, isError: query.isError, refetch: query.refetch }
}
