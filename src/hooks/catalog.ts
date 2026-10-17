/**
 * Hooks de dados (TanStack Query) — única porta de entrada da UI para o catálogo.
 *
 * Todas as chaves começam com 'catalog'. O banco local emite eventos a cada
 * escrita (inclusive de outras abas) e `CatalogSync` invalida tudo, então as
 * mutações não precisam invalidar manualmente.
 */
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { adminService } from '@/services/admin'
import { productService } from '@/services/products'
import { categoryService, distributorService } from '@/services/taxonomy'
import type {
  Category,
  CategoryInput,
  Distributor,
  DistributorInput,
  Product,
  ProductInput,
  ProductQuery,
  ProductStatus,
} from '@/types/catalog'

export const catalogKeys = {
  all: ['catalog'] as const,
  productQuery: (q: ProductQuery) => ['catalog', 'products', 'query', q] as const,
  productList: (includeInactive: boolean) => ['catalog', 'products', 'list', includeInactive] as const,
  featured: (limit: number) => ['catalog', 'products', 'featured', limit] as const,
  product: (id: string) => ['catalog', 'products', 'detail', id] as const,
  related: (id: string) => ['catalog', 'products', 'related', id] as const,
  suggest: (q: string) => ['catalog', 'products', 'suggest', q] as const,
  categories: ['catalog', 'categories'] as const,
  categoryUsage: ['catalog', 'categories', 'usage'] as const,
  distributors: ['catalog', 'distributors'] as const,
  distributorUsage: ['catalog', 'distributors', 'usage'] as const,
  stats: ['catalog', 'stats'] as const,
}

// ------------------------------------------------------------------ leitura

/** Consulta paginada com filtros/facetas. Mantém o resultado anterior enquanto carrega. */
export function useProductQuery(query: ProductQuery, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: catalogKeys.productQuery(query),
    queryFn: () => productService.query(query),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  })
}

export function useProducts(options: { includeInactive?: boolean } = {}) {
  const includeInactive = options.includeInactive ?? false
  return useQuery({
    queryKey: catalogKeys.productList(includeInactive),
    queryFn: () => productService.list({ includeInactive }),
  })
}

export function useFeaturedProducts(limit = 12) {
  return useQuery({ queryKey: catalogKeys.featured(limit), queryFn: () => productService.featured(limit) })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: catalogKeys.product(id ?? ''),
    queryFn: () => productService.getById(id as string),
    enabled: Boolean(id),
  })
}

export function useRelatedProducts(product: Product | null | undefined, limit = 8) {
  return useQuery({
    queryKey: catalogKeys.related(product?.id ?? ''),
    queryFn: () => productService.related(product as Product, limit),
    enabled: Boolean(product),
  })
}

/** Sugestões do campo de busca (passe o termo já com debounce). */
export function useSearchSuggestions(search: string, limit = 6) {
  const term = search.trim()
  return useQuery({
    queryKey: catalogKeys.suggest(`${term}|${limit}`),
    queryFn: () => productService.suggest(term, limit),
    enabled: term.length >= 2,
    placeholderData: keepPreviousData,
  })
}

export function useCategories() {
  return useQuery({ queryKey: catalogKeys.categories, queryFn: () => categoryService.list() })
}

export function useDistributors() {
  return useQuery({ queryKey: catalogKeys.distributors, queryFn: () => distributorService.list() })
}

export function useCategoryUsage() {
  return useQuery({ queryKey: catalogKeys.categoryUsage, queryFn: () => categoryService.usage() })
}

export function useDistributorUsage() {
  return useQuery({ queryKey: catalogKeys.distributorUsage, queryFn: () => distributorService.usage() })
}

export function useDashboardStats() {
  return useQuery({ queryKey: catalogKeys.stats, queryFn: () => adminService.stats() })
}

export interface CatalogLookups {
  categories: Category[]
  distributors: Distributor[]
  categoryById: Map<string, Category>
  distributorById: Map<string, Distributor>
  categoryName: (id: string) => string
  distributorName: (id: string) => string
  isLoading: boolean
}

/** Mapas id → entidade para exibir nomes de categoria/distribuidor. */
export function useCatalogLookups(): CatalogLookups {
  const categories = useCategories()
  const distributors = useDistributors()
  return useMemo(() => {
    const cats = categories.data ?? []
    const dists = distributors.data ?? []
    const categoryById = new Map(cats.map((c) => [c.id, c]))
    const distributorById = new Map(dists.map((d) => [d.id, d]))
    return {
      categories: cats,
      distributors: dists,
      categoryById,
      distributorById,
      categoryName: (id: string) => categoryById.get(id)?.name ?? '—',
      distributorName: (id: string) => distributorById.get(id)?.name ?? '—',
      isLoading: categories.isLoading || distributors.isLoading,
    }
  }, [categories.data, distributors.data, categories.isLoading, distributors.isLoading])
}

// ------------------------------------------------------------------ escrita

export function useCreateProduct() {
  return useMutation({ mutationFn: (input: ProductInput) => productService.create(input) })
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductInput }) => productService.update(id, input),
  })
}

export function usePatchProduct() {
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<Product, 'status' | 'isFeatured'>> }) =>
      productService.patch(id, patch),
  })
}

export function useSetProductsStatus() {
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: ProductStatus }) => productService.setStatus(ids, status),
  })
}

export function useDeleteProduct() {
  return useMutation({ mutationFn: (id: string) => productService.remove(id) })
}

export function useDeleteProducts() {
  return useMutation({ mutationFn: (ids: string[]) => productService.removeMany(ids) })
}

export function useSaveCategory() {
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CategoryInput }) =>
      id ? categoryService.update(id, input) : categoryService.create(input),
  })
}

export function useDeleteCategory() {
  return useMutation({
    mutationFn: ({ id, reassignTo }: { id: string; reassignTo?: string }) => categoryService.remove(id, { reassignTo }),
  })
}

export function useSaveDistributor() {
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: DistributorInput }) =>
      id ? distributorService.update(id, input) : distributorService.create(input),
  })
}

export function useDeleteDistributor() {
  return useMutation({
    mutationFn: ({ id, reassignTo }: { id: string; reassignTo?: string }) =>
      distributorService.remove(id, { reassignTo }),
  })
}
