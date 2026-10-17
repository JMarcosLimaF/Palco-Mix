import { RotateCcw, SearchX, SlidersHorizontal } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Breadcrumbs } from '@/components/catalog/breadcrumbs'
import { CatalogFilters } from '@/components/catalog/catalog-filters'
import { catalogTitle, defaultSort } from '@/components/catalog/catalog-helpers'
import { ActiveFilters, SortSelect } from '@/components/catalog/catalog-toolbar'
import { ProductGrid, ProductGridSkeleton } from '@/components/catalog/product-grid'
import { useCatalogUrl } from '@/components/catalog/use-catalog-url'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/feedback'
import { Drawer } from '@/components/ui/modal'
import { Pagination } from '@/components/ui/pagination'
import { CATALOG_PAGE_SIZE } from '@/config/site'
import { useCatalogLookups, useProductQuery } from '@/hooks/catalog'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useMediaQuery } from '@/hooks/use-media-query'
import { catalogHref, countActiveFilters } from '@/lib/catalog-params'
import { cn, pluralize } from '@/lib/utils'
import type { ProductSort } from '@/types/catalog'

export default function CatalogPage() {
  const { query, canonical, update, clearFilters, clearAll } = useCatalogUrl()
  const lookups = useCatalogLookups()
  const { categoryById, distributorById } = lookups

  const fullQuery = useMemo(() => ({ ...query, pageSize: CATALOG_PAGE_SIZE }), [query])
  const { data, isLoading, isError, isPlaceholderData, refetch } = useProductQuery(fullQuery)

  const title = useMemo(() => catalogTitle(query, { categoryById, distributorById }), [query, categoryById, distributorById])
  useDocumentTitle(title)

  const search = query.search?.trim()
  const activeCount = countActiveFilters(query)
  const total = data?.total
  const [filtersOpen, setFiltersOpen] = useState(false)
  const resultsRef = useRef<HTMLElement>(null)
  // a sidebar só é montada no desktop; abaixo de lg os filtros vivem no drawer
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const reduceMotion = useReducedMotion()

  const handleSortChange = useCallback(
    (sort: ProductSort) => update({ sort: sort === defaultSort(query) ? undefined : sort }),
    [update, query],
  )

  const handlePageChange = useCallback(
    (page: number) => {
      update({ page }, { keepPage: true })
      resultsRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    },
    [update, reduceMotion],
  )

  const handleClearEverything = useCallback(() => {
    clearAll()
    setFiltersOpen(false)
  }, [clearAll])

  const rangeStart = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0
  const rangeEnd = data ? rangeStart + data.items.length - 1 : 0
  const totalLabel = total !== undefined ? pluralize(total, 'produto', 'produtos') : null

  return (
    <div className="container-page pt-6 pb-20 sm:pt-8 lg:pb-28">
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Catálogo' }]} />

      <header className="mt-5 flex flex-col gap-3 border-b border-line pb-6 sm:mt-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
        <h1 id="catalog-title" className="title-display min-w-0 text-4xl break-words sm:text-5xl lg:text-6xl">
          {search ? (
            <>
              <span className="text-muted">Resultados para </span>
              <span className="text-brand-gradient pr-1">“{search}”</span>
            </>
          ) : (
            title
          )}
        </h1>
        <p className="shrink-0 text-sm font-medium text-muted tabular-nums sm:pb-1.5" aria-live="polite">
          {totalLabel ?? <span className="skeleton inline-block h-4 w-24 rounded-full align-middle" aria-hidden />}
        </p>
      </header>

      <div className="mt-6 flex gap-10 lg:mt-8 xl:gap-14">
        {/* Filtros — desktop */}
        <aside className="hidden w-64 shrink-0 lg:block" aria-label="Filtros do catálogo">
          {isDesktop && (
            <div className="sticky top-24 -mr-3 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain pr-3 pb-8 [scrollbar-width:thin]">
              <CatalogFilters query={query} facets={data?.facets} onChange={update} onClearFilters={clearFilters} />
            </div>
          )}
        </aside>

        <section ref={resultsRef} className="min-w-0 flex-1" aria-labelledby="catalog-title">
          {/* Barra mobile/tablet: filtros + ordenação */}
          <div className="mb-5 grid grid-cols-2 gap-2 lg:hidden">
            <Button
              variant="outline"
              className="h-10 justify-center text-[0.8125rem]"
              onClick={() => setFiltersOpen(true)}
              aria-haspopup="dialog"
            >
              <SlidersHorizontal aria-hidden />
              Filtros
              {activeCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[0.6875rem] font-bold text-white tabular-nums">
                  {activeCount}
                </span>
              )}
            </Button>
            <SortSelect query={query} onSortChange={handleSortChange} />
          </div>

          {/* Toolbar: chips ativos · contagem · ordenação */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ActiveFilters query={query} onChange={update} onClearAll={clearAll} className="min-w-0" />
            <div className="flex shrink-0 items-center gap-4 sm:ml-auto">
              {data && data.total > 0 && (
                <p className="text-xs text-muted tabular-nums">
                  Mostrando{' '}
                  <span className="font-semibold text-fg">
                    {rangeStart}–{rangeEnd}
                  </span>{' '}
                  de <span className="font-semibold text-fg">{data.total.toLocaleString('pt-BR')}</span>
                </p>
              )}
              <SortSelect query={query} onSortChange={handleSortChange} className="hidden w-48 lg:block" />
            </div>
          </div>

          {isLoading ? (
            <ProductGridSkeleton count={12} />
          ) : isError && !data ? (
            <EmptyState
              title="Não foi possível carregar os produtos"
              description="Algo deu errado ao buscar o catálogo. Tente novamente."
              action={
                <Button variant="secondary" onClick={() => void refetch()}>
                  <RotateCcw aria-hidden />
                  Tentar novamente
                </Button>
              }
            />
          ) : data && data.items.length > 0 ? (
            <>
              <ProductGrid items={data.items} pending={isPlaceholderData} resultKey={canonical} />
              <Pagination
                page={data.page}
                pageCount={data.pageCount}
                onPageChange={handlePageChange}
                className="mt-14 border-t border-line pt-8"
              />
            </>
          ) : (
            <CatalogEmpty
              hasSearch={Boolean(search)}
              hasFilters={activeCount > 0}
              onClear={handleClearEverything}
              categories={lookups.categories}
              className={cn(isPlaceholderData && 'opacity-60')}
            />
          )}
        </section>
      </div>

      {/* Filtros — mobile/tablet */}
      <Drawer
        open={filtersOpen && !isDesktop}
        onOpenChange={setFiltersOpen}
        title="Filtros"
        description={total !== undefined ? pluralize(total, 'produto encontrado', 'produtos encontrados') : undefined}
        footer={
          <>
            <Button variant="outline" onClick={clearFilters} disabled={activeCount === 0}>
              Limpar
            </Button>
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
              {total === undefined ? 'Ver produtos' : total === 0 ? 'Nenhum produto' : `Ver ${totalLabel}`}
            </Button>
          </>
        }
      >
        <CatalogFilters
          query={query}
          facets={data?.facets}
          onChange={update}
          onClearFilters={clearFilters}
          showHeader={false}
        />
      </Drawer>
    </div>
  )
}

interface CatalogEmptyProps {
  hasSearch: boolean
  hasFilters: boolean
  onClear: () => void
  categories: Array<{ id: string; name: string }>
  className?: string
}

function CatalogEmpty({ hasSearch, hasFilters, onClear, categories, className }: CatalogEmptyProps) {
  const suggestions = categories.slice(0, 8)
  return (
    <div className={cn('rounded-3xl border border-dashed border-line-strong bg-surface/60 transition-opacity', className)}>
      <EmptyState
        icon={<SearchX className="size-7" aria-hidden />}
        title="Nenhum produto encontrado"
        description={
          hasSearch && hasFilters
            ? 'Nada combina com essa busca e esses filtros juntos. Tente remover algum filtro ou buscar por outro termo.'
            : hasSearch
              ? 'Não encontramos produtos para essa busca. Confira a grafia ou tente um termo mais geral, como “sandália” ou o nome da marca.'
              : 'Nenhum produto combina com os filtros escolhidos. Tente ampliar a faixa de preço ou remover algum filtro.'
        }
        action={
          (hasSearch || hasFilters) && (
            <Button variant="secondary" onClick={onClear}>
              <RotateCcw aria-hidden />
              {hasSearch ? 'Limpar busca e filtros' : 'Limpar filtros'}
            </Button>
          )
        }
      />
      {suggestions.length > 0 && (
        <div className="-mt-6 px-6 pb-12 text-center">
          <p className="eyebrow text-subtle">Explore por categoria</p>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {suggestions.map((c) => (
              <li key={c.id}>
                <Link
                  to={catalogHref({ categories: [c.id] })}
                  className="inline-flex h-9 items-center rounded-full border border-line bg-elevated px-4 text-xs font-semibold text-fg transition-[border-color,background-color,transform] duration-200 ease-out-expo hover:border-fg/40 hover:bg-surface-2 active:scale-[0.97]"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
