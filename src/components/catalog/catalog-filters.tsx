import { memo, useCallback } from 'react'
import { Switch } from '@/components/ui/form'
import { useCatalogLookups } from '@/hooks/catalog'
import { countActiveFilters } from '@/lib/catalog-params'
import { cn } from '@/lib/utils'
import type { ProductFacets, ProductQuery } from '@/types/catalog'
import { CatalogSearchInput } from './catalog-search-input'
import { FacetList } from './facet-list'
import { FilterSection } from './filter-section'
import { PriceFilter } from './price-filter'
import type { CatalogUpdateOptions } from './use-catalog-url'

export interface CatalogFiltersProps {
  query: ProductQuery
  facets: ProductFacets | undefined
  onChange: (patch: Partial<ProductQuery>, options?: CatalogUpdateOptions) => void
  onClearFilters: () => void
  /** cabeçalho "Filtros / Limpar" (a sidebar mostra; o drawer já tem título) */
  showHeader?: boolean
  className?: string
}

function toggle(list: string[] | undefined, id: string): string[] | undefined {
  const set = new Set(list)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  return set.size ? Array.from(set) : undefined
}

/** Painel completo de filtros (sidebar no desktop, drawer no mobile). */
export const CatalogFilters = memo(function CatalogFilters({
  query,
  facets,
  onChange,
  onClearFilters,
  showHeader = true,
  className,
}: CatalogFiltersProps) {
  const lookups = useCatalogLookups()
  const activeCount = countActiveFilters(query)
  const priceActive = query.minPrice !== undefined || query.maxPrice !== undefined

  const handleSearch = useCallback(
    (term: string) => onChange({ search: term || undefined }, { replace: true }),
    [onChange],
  )
  const toggleCategory = useCallback(
    (id: string) => onChange({ categories: toggle(query.categories, id) }),
    [onChange, query.categories],
  )
  const toggleDistributor = useCallback(
    (id: string) => onChange({ distributors: toggle(query.distributors, id) }),
    [onChange, query.distributors],
  )
  const handlePrice = useCallback(
    (minPrice: number | undefined, maxPrice: number | undefined) => onChange({ minPrice, maxPrice }),
    [onChange],
  )

  return (
    <div className={cn('flex flex-col', className)}>
      {showHeader && (
        <div className="flex min-h-9 items-center justify-between gap-3 pb-3">
          <h2 className="eyebrow text-subtle">Filtrar produtos</h2>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="rounded-full text-xs font-bold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      <CatalogSearchInput value={query.search ?? ''} onCommit={handleSearch} className="mb-1" />

      <FilterSection title="Categorias" count={query.categories?.length}>
        <FacetList
          label="Categorias"
          options={lookups.categories}
          selected={query.categories}
          counts={facets?.categories}
          onToggle={toggleCategory}
          loading={lookups.isLoading}
          limit={10}
        />
      </FilterSection>

      <FilterSection title="Distribuidores" count={query.distributors?.length}>
        <FacetList
          label="Distribuidores"
          options={lookups.distributors}
          selected={query.distributors}
          counts={facets?.distributors}
          onToggle={toggleDistributor}
          loading={lookups.isLoading}
          limit={8}
          searchable
          sortByCount
          searchPlaceholder="Buscar distribuidor"
        />
      </FilterSection>

      <FilterSection title="Preço" count={priceActive ? 1 : 0}>
        <PriceFilter
          minPrice={query.minPrice}
          maxPrice={query.maxPrice}
          range={facets?.priceRange}
          onChange={handlePrice}
        />
      </FilterSection>

      <FilterSection title="Ofertas e destaques" count={(query.featured ? 1 : 0) + (query.onSale ? 1 : 0)}>
        <div className="space-y-4 py-1">
          <Switch
            checked={Boolean(query.featured)}
            onCheckedChange={(checked) => onChange({ featured: checked || undefined })}
            label="Somente destaques"
            description="Seleção em destaque da loja"
          />
          <Switch
            checked={Boolean(query.onSale)}
            onCheckedChange={(checked) => onChange({ onSale: checked || undefined })}
            label="Em promoção"
            description="Produtos com preço promocional"
          />
        </div>
      </FilterSection>
    </div>
  )
})
