import { RotateCcw, SearchX, SlidersHorizontal } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Breadcrumbs } from '@/components/catalog/breadcrumbs'
import { CatalogFilters } from '@/components/catalog/catalog-filters'
import { CatalogPager } from '@/components/catalog/catalog-pager'
import { catalogTitle, defaultSort } from '@/components/catalog/catalog-helpers'
import { ActiveFilters, SortSelect } from '@/components/catalog/catalog-toolbar'
import { ProductGrid, ProductGridSkeleton } from '@/components/catalog/product-grid'
import { useCatalogUrl } from '@/components/catalog/use-catalog-url'
import { useStuck } from '@/components/catalog/use-stuck'
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
  const { query, canonical, update, clearFilters, clearAll, filtersOpen, openFilters, closeFilters } = useCatalogUrl()
  const lookups = useCatalogLookups()
  const { categoryById, distributorById } = lookups

  const fullQuery = useMemo(() => ({ ...query, pageSize: CATALOG_PAGE_SIZE }), [query])
  const { data, isLoading, isError, isPlaceholderData, refetch } = useProductQuery(fullQuery)

  const title = useMemo(() => catalogTitle(query, { categoryById, distributorById }), [query, categoryById, distributorById])
  useDocumentTitle(title)

  const search = query.search?.trim()
  const activeCount = countActiveFilters(query)
  const total = data?.total
  const resultsRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  // página pedida pela paginação — anunciada quando os resultados dela chegam
  const [pagedTo, setPagedTo] = useState<number | null>(null)
  // a sidebar só é montada no desktop; abaixo de lg os filtros vivem no drawer
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const reduceMotion = useReducedMotion()
  // barra "Ordenar | Filtros" do celular: gruda logo abaixo do cabeçalho do site (64px)
  const toolbarSentinel = useRef<HTMLDivElement>(null)
  const toolbarStuck = useStuck(toolbarSentinel, 64)

  // drawer aberto (estado no histórico) e a tela virou desktop: sai do modo drawer
  useEffect(() => {
    if (isDesktop && filtersOpen) closeFilters()
  }, [isDesktop, filtersOpen, closeFilters])

  // alvo do foco quando o controle acionado some (chip removido, "limpar")
  const focusTitle = useCallback(() => titleRef.current?.focus({ preventScroll: true }), [])

  const handleSortChange = useCallback(
    (sort: ProductSort) => update({ sort: sort === defaultSort(query) ? undefined : sort }),
    [update, query],
  )

  const handlePageChange = useCallback(
    (page: number) => {
      update({ page }, { keepPage: true })
      setPagedTo(page)
      // o foco acompanha a rolagem (senão fica na paginação, lá embaixo)
      resultsRef.current?.focus({ preventScroll: true })
      resultsRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    },
    [update, reduceMotion],
  )

  const handleClearEverything = useCallback(() => {
    focusTitle()
    clearAll()
  }, [clearAll, focusTitle])

  const rangeStart = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0
  const rangeEnd = data ? rangeStart + data.items.length - 1 : 0
  const totalLabel = total !== undefined ? pluralize(total, 'produto', 'produtos') : null
  // chips de filtros ativos (inclui a busca) — sem eles a linha da toolbar some no celular
  const hasChips = activeCount > 0 || Boolean(search)

  return (
    <div className="container-page pt-5 pb-14 sm:pt-8 sm:pb-20 lg:pb-28">
      {/* no celular a trilha "Início / Catálogo" não acrescenta nada: o título já diz onde se está */}
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Catálogo' }]} className="hidden sm:block" />

      <header className="flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-end sm:justify-between sm:border-b sm:border-line sm:pb-8">
        <h1
          ref={titleRef}
          id="catalog-title"
          tabIndex={-1}
          className="title-display min-w-0 text-[2.125rem] break-words outline-none sm:text-5xl lg:text-6xl"
        >
          {search ? (
            <>
              <span className="text-muted">Resultados para </span>
              <span className="text-brand-gradient pr-1">“{search}”</span>
            </>
          ) : (
            title
          )}
        </h1>
        {/* abaixo de lg a contagem fica na barra fixa (não repete aqui) */}
        <p className="hidden shrink-0 text-sm font-medium text-muted tabular-nums sm:pb-1.5 lg:block" aria-live="polite">
          {totalLabel ?? <span className="skeleton inline-block h-4 w-24 rounded-full align-middle" aria-hidden />}
        </p>
      </header>

      <div className="mt-3 flex gap-10 sm:mt-6 lg:mt-8 xl:gap-14">
        {/* Filtros — desktop */}
        <aside className="hidden w-64 shrink-0 lg:block" aria-label="Filtros do catálogo">
          {isDesktop && (
            <div className="sticky top-24 -mr-3 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain pr-3 pb-8 [scrollbar-width:thin]">
              <CatalogFilters query={query} facets={data?.facets} onChange={update} onClearFilters={clearFilters} />
            </div>
          )}
        </aside>

        <section ref={resultsRef} tabIndex={-1} className="min-w-0 flex-1 outline-none" aria-labelledby="catalog-title">
          {/* Barra mobile/tablet: contagem · ordenar · filtros — gruda sob o cabeçalho do site */}
          <div ref={toolbarSentinel} className="h-px lg:hidden" aria-hidden />
          <div
            className={cn(
              'sticky top-16 z-30 -mx-4 -mt-px mb-3 flex items-center gap-2 border-b px-4 py-2 sm:-mx-6 sm:mb-5 sm:px-6 lg:hidden',
              'transition-[background-color,border-color,box-shadow] duration-300 ease-out-expo',
              toolbarStuck
                ? 'border-line bg-bg/85 shadow-[0_10px_24px_-18px_rgb(13_13_13/0.35)] backdrop-blur-xl backdrop-saturate-150'
                : 'border-transparent',
            )}
          >
            <p className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold text-fg tabular-nums" aria-live="polite">
              {totalLabel ?? <span className="skeleton inline-block h-4 w-20 rounded-full align-middle" aria-hidden />}
            </p>
            <SortSelect query={query} onSortChange={handleSortChange} variant="pill" />
            <Button
              variant={activeCount > 0 ? 'secondary' : 'outline'}
              className="h-11 gap-1.5 px-3.5 text-[0.8125rem]"
              onClick={openFilters}
              aria-haspopup="dialog"
            >
              <SlidersHorizontal aria-hidden />
              Filtros
              {activeCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[0.6875rem] font-bold text-white tabular-nums">
                  <span className="sr-only">(</span>
                  {activeCount}
                  <span className="sr-only"> ativos)</span>
                </span>
              )}
            </Button>
          </div>

          {/* Toolbar: chips ativos · contagem · ordenação (no celular, só os chips — rolam numa linha) */}
          {(hasChips || isDesktop) && (
            <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <ActiveFilters
                query={query}
                onChange={update}
                onClearAll={clearAll}
                onFocusFallback={focusTitle}
                className="min-w-0"
              />
              <div className="hidden shrink-0 items-center gap-4 sm:ml-auto lg:flex">
                {data && data.total > 0 && (
                  <p className="text-xs text-muted tabular-nums">
                    Mostrando{' '}
                    <span className="font-semibold text-fg">
                      {rangeStart}–{rangeEnd}
                    </span>{' '}
                    de <span className="font-semibold text-fg">{data.total.toLocaleString('pt-BR')}</span>
                  </p>
                )}
                <SortSelect query={query} onSortChange={handleSortChange} className="w-48" />
              </div>
            </div>
          )}

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
              <CatalogPager
                page={data.page}
                pageCount={data.pageCount}
                onPageChange={handlePageChange}
                className="mt-10 border-t border-line pt-6 sm:hidden"
              />
              <Pagination
                page={data.page}
                pageCount={data.pageCount}
                onPageChange={handlePageChange}
                className="mt-14 hidden border-t border-line pt-8 sm:flex"
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

      <p className="sr-only" aria-live="polite">
        {data && !isPlaceholderData && pagedTo === data.page ? `Página ${data.page} de ${data.pageCount}` : ''}
      </p>

      {/* Filtros — mobile/tablet (aberto = entrada no histórico: o "voltar" fecha) */}
      <Drawer
        open={filtersOpen && !isDesktop}
        onOpenChange={(open) => (open ? openFilters() : closeFilters())}
        title="Filtros"
        description={total !== undefined ? pluralize(total, 'produto encontrado', 'produtos encontrados') : undefined}
        // quase a largura toda no celular (a faixa do véu à esquerda ainda indica "toque para fechar")
        className="w-[min(26rem,92vw)]"
        footer={
          <>
            <Button variant="outline" className="h-12 px-5" onClick={clearFilters} disabled={activeCount === 0}>
              Limpar
            </Button>
            <Button className="h-12 flex-1" onClick={closeFilters}>
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
