import { useMemo } from 'react'
import { useCategories, useDistributors, useProducts } from '@/hooks/catalog'
import type { Category, Distributor } from '@/types/catalog'

export interface TaxonomyEntry<T> {
  item: T
  /** produtos ativos vinculados */
  count: number
}

export interface NavTaxonomy {
  /** categorias com produtos ativos, A–Z */
  categories: TaxonomyEntry<Category>[]
  /** categorias com produtos ativos, por volume */
  topCategories: TaxonomyEntry<Category>[]
  /** distribuidores com produtos ativos, A–Z */
  distributors: TaxonomyEntry<Distributor>[]
  /** distribuidores com produtos ativos, por volume */
  topDistributors: TaxonomyEntry<Distributor>[]
  /** total de produtos ativos */
  totalProducts: number
  isLoading: boolean
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })

function rank<T extends { id: string; name: string }>(items: T[] | undefined, counts: Map<string, number> | null) {
  const entries = (items ?? []).map((item) => ({ item, count: counts?.get(item.id) ?? 0 }))
  // enquanto as contagens não chegam, mostra tudo; depois, só quem tem produto ativo
  const visible = counts ? entries.filter((e) => e.count > 0) : entries
  const alpha = [...visible].sort((a, b) => collator.compare(a.item.name, b.item.name))
  const top = [...visible].sort((a, b) => b.count - a.count || collator.compare(a.item.name, b.item.name))
  return { alpha, top }
}

/**
 * Categorias e distribuidores com a contagem de produtos ativos
 * (menu de categorias, menu mobile, rodapé e buscas populares).
 */
export function useNavTaxonomy(): NavTaxonomy {
  const products = useProducts()
  const categories = useCategories()
  const distributors = useDistributors()
  const productList = products.data
  const categoryList = categories.data
  const distributorList = distributors.data
  const isLoading = categories.isPending || distributors.isPending

  return useMemo(() => {
    let byCategory: Map<string, number> | null = null
    let byDistributor: Map<string, number> | null = null
    if (productList) {
      byCategory = new Map()
      byDistributor = new Map()
      for (const p of productList) {
        byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1)
        byDistributor.set(p.distributor, (byDistributor.get(p.distributor) ?? 0) + 1)
      }
    }
    const cats = rank(categoryList, byCategory)
    const dists = rank(distributorList, byDistributor)
    return {
      categories: cats.alpha,
      topCategories: cats.top,
      distributors: dists.alpha,
      topDistributors: dists.top,
      totalProducts: productList?.length ?? 0,
      isLoading,
    }
  }, [productList, categoryList, distributorList, isLoading])
}
