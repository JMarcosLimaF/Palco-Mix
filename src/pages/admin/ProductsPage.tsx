import { PackagePlus, Plus, RotateCcw, SearchX, ServerCrash } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { BulkActionsBar } from '@/components/admin/products/bulk-actions-bar'
import { DeleteProductDialog, DeleteProductsDialog } from '@/components/admin/products/delete-product-dialog'
import { ProductsMobileList, ProductsMobileListSkeleton } from '@/components/admin/products/products-mobile-list'
import {
  adminFiltersToQuery,
  applyAdminFiltersPatch,
  clearAdminFilters,
  FROM_LIST_STATE,
  hasAdminFilters,
  PAGE_SIZE_OPTIONS,
  parseAdminProductParams,
  type AdminFiltersPatch,
} from '@/components/admin/products/products-params'
import { ProductsTable, ProductsTableSkeleton } from '@/components/admin/products/products-table'
import { ProductsToolbar } from '@/components/admin/products/products-toolbar'
import { useDashboardStats } from '@/components/admin/dashboard/use-dashboard-stats'
import { useProductQuickActions } from '@/components/admin/products/use-product-quick-actions'
import { AdminPageHeader, Panel } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { EmptyState } from '@/components/ui/feedback'
import { Select } from '@/components/ui/form'
import { Pagination } from '@/components/ui/pagination'
import {
  useCatalogLookups,
  useDeleteProduct,
  useDeleteProducts,
  useProductQuery,
  useSetProductsStatus,
} from '@/hooks/catalog'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useMediaQuery } from '@/hooks/use-media-query'
import { pluralize } from '@/lib/utils'
import { errorMessage } from '@/services/errors'
import type { Product, ProductStatus } from '@/types/catalog'

const NO_SELECTION: ReadonlySet<string> = new Set()

interface SelectionState {
  /** filtros + página em que a seleção foi feita; trocar qualquer um limpa a seleção */
  scope: string
  ids: ReadonlySet<string>
}

export default function ProductsPage() {
  useDocumentTitle('Produtos · Admin')
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseAdminProductParams(searchParams), [searchParams])
  const query = useMemo(() => adminFiltersToQuery(filters), [filters])
  const { data, isLoading, isError, isPlaceholderData, refetch, isRefetching } = useProductQuery(query)
  const stats = useDashboardStats()
  const lookups = useCatalogLookups()
  const actions = useProductQuickActions()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const reduceMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  const items = useMemo(() => data?.items ?? [], [data])
  const filtered = hasAdminFilters(filters)

  // ---------------------------------------------------------------- URL
  const updateFilters = useCallback(
    (patch: AdminFiltersPatch, options?: { replace?: boolean }) => {
      setSearchParams((prev) => applyAdminFiltersPatch(prev, patch), {
        preventScrollReset: true,
        replace: options?.replace,
      })
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams((prev) => clearAdminFilters(prev), { preventScrollReset: true })
  }, [setSearchParams])

  function goToPage(page: number) {
    updateFilters({ page })
    const el = panelRef.current
    if (el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    }
  }

  // ---------------------------------------------------------------- seleção
  const scope = searchParams.toString()
  const [selection, setSelection] = useState<SelectionState>({ scope, ids: NO_SELECTION })

  const selectedIds = useMemo<ReadonlySet<string>>(() => {
    if (selection.scope !== scope || selection.ids.size === 0) return NO_SELECTION
    return new Set(items.filter((p) => selection.ids.has(p.id)).map((p) => p.id))
  }, [selection, scope, items])

  const selectedProducts = useMemo(() => items.filter((p) => selectedIds.has(p.id)), [items, selectedIds])

  const toggleSelect = useCallback(
    (id: string) => {
      setSelection((prev) => {
        const ids = new Set(prev.scope === scope ? prev.ids : NO_SELECTION)
        if (ids.has(id)) ids.delete(id)
        else ids.add(id)
        return { scope, ids }
      })
    },
    [scope],
  )

  const toggleAll = useCallback(
    (checked: boolean) => setSelection({ scope, ids: checked ? new Set(items.map((p) => p.id)) : NO_SELECTION }),
    [scope, items],
  )

  const clearSelection = useCallback(() => setSelection({ scope, ids: NO_SELECTION }), [scope])

  // ---------------------------------------------------------------- exclusão individual
  const deleteOne = useDeleteProduct()
  const [deleteState, setDeleteState] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  })
  const requestDelete = useCallback((product: Product) => setDeleteState({ open: true, product }), [])

  async function confirmDelete() {
    const product = deleteState.product
    if (!product) return
    try {
      await deleteOne.mutateAsync(product.id)
      toast.success('Produto excluído', { description: product.name })
    } catch (err) {
      toast.error(errorMessage(err))
      throw err
    }
  }

  // ---------------------------------------------------------------- ações em lote
  const setStatus = useSetProductsStatus()
  const deleteMany = useDeleteProducts()
  const [bulkBusy, setBulkBusy] = useState<'activate' | 'deactivate' | null>(null)
  const [bulkDelete, setBulkDelete] = useState<{ open: boolean; products: Product[] }>({ open: false, products: [] })

  const activeSelected = selectedProducts.filter((p) => p.status === 'active').length
  const inactiveSelected = selectedProducts.length - activeSelected

  async function bulkSetStatus(status: ProductStatus) {
    const ids = selectedProducts.filter((p) => p.status !== status).map((p) => p.id)
    if (ids.length === 0) return
    setBulkBusy(status === 'active' ? 'activate' : 'deactivate')
    try {
      await setStatus.mutateAsync({ ids, status })
      toast.success(
        status === 'active'
          ? pluralize(ids.length, 'produto ativado', 'produtos ativados')
          : pluralize(ids.length, 'produto inativado', 'produtos inativados'),
        { description: status === 'active' ? 'Já aparecem na loja.' : 'Não aparecem mais na loja.' },
      )
      clearSelection()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBulkBusy(null)
    }
  }

  async function confirmBulkDelete() {
    const ids = bulkDelete.products.map((p) => p.id)
    if (ids.length === 0) return
    try {
      const removed = await deleteMany.mutateAsync(ids)
      toast.success(pluralize(removed, 'produto excluído', 'produtos excluídos'))
      clearSelection()
    } catch (err) {
      toast.error(errorMessage(err))
      throw err
    }
  }

  // ---------------------------------------------------------------- render
  const total = data?.total ?? 0
  const rangeStart = data && total > 0 ? (data.page - 1) * data.pageSize + 1 : 0
  const rangeEnd = data ? Math.min(data.page * data.pageSize, total) : 0
  const s = stats.data

  let content: ReactNode
  if (isLoading) {
    content = isDesktop ? (
      <ProductsTableSkeleton rows={Math.min(filters.pageSize, 10)} />
    ) : (
      <ProductsMobileListSkeleton rows={6} />
    )
  } else if (isError && !data) {
    content = (
      <EmptyState
        icon={<ServerCrash className="size-7" aria-hidden />}
        title="Não foi possível carregar os produtos"
        description="Tente novamente em instantes."
        action={
          <Button variant="outline" onClick={() => void refetch()} loading={isRefetching}>
            <RotateCcw aria-hidden />
            Tentar novamente
          </Button>
        }
      />
    )
  } else if (total === 0) {
    content = filtered ? (
      <EmptyState
        icon={<SearchX className="size-7" aria-hidden />}
        title="Nenhum produto encontrado"
        description={
          filters.search.trim()
            ? `Nada corresponde a “${filters.search.trim()}” com os filtros atuais. Revise a busca ou limpe os filtros.`
            : 'Nenhum produto corresponde aos filtros selecionados.'
        }
        action={
          <Button variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={<PackagePlus className="size-7" aria-hidden />}
        title="Nenhum produto cadastrado"
        description="Cadastre o primeiro produto para ele aparecer na vitrine da Palco Mix."
        action={
          <Link to="/admin/produtos/novo" state={FROM_LIST_STATE} className={buttonVariants()}>
            <Plus aria-hidden />
            Cadastrar produto
          </Link>
        }
      />
    )
  } else if (isDesktop) {
    content = (
      <ProductsTable
        items={items}
        categoryName={lookups.categoryName}
        distributorName={lookups.distributorName}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleAll={toggleAll}
        actions={actions}
        onDelete={requestDelete}
        stale={isPlaceholderData}
      />
    )
  } else {
    content = (
      <ProductsMobileList
        items={items}
        categoryName={lookups.categoryName}
        distributorName={lookups.distributorName}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleAll={toggleAll}
        actions={actions}
        onDelete={requestDelete}
        stale={isPlaceholderData}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <AdminPageHeader
        title="Produtos"
        description={
          s ? (
            <>
              {pluralize(s.totalProducts, 'produto', 'produtos')} no catálogo
              <span className="text-subtle"> · </span>
              {pluralize(s.activeProducts, 'ativo', 'ativos')}
              <span className="text-subtle"> · </span>
              {pluralize(s.featuredProducts, 'destaque ativo', 'destaques ativos')}
            </>
          ) : (
            <>
              <span className="skeleton inline-block h-4 w-56 rounded-full align-middle" aria-hidden />
              <span className="sr-only">Carregando totais…</span>
            </>
          )
        }
        actions={
          <Link to="/admin/produtos/novo" state={FROM_LIST_STATE} className={buttonVariants()}>
            <Plus aria-hidden />
            Novo produto
          </Link>
        }
      />

      <div ref={panelRef} className="scroll-mt-24">
        <Panel className="overflow-hidden">
          <ProductsToolbar
            filters={filters}
            onChange={updateFilters}
            onClear={clearFilters}
            categories={lookups.categories}
            distributors={lookups.distributors}
          />

          {content}

          {data && total > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row sm:px-5">
              <p className="text-sm text-muted tabular-nums" aria-live="polite">
                Mostrando{' '}
                <span className="font-semibold text-fg">
                  {rangeStart.toLocaleString('pt-BR')}–{rangeEnd.toLocaleString('pt-BR')}
                </span>{' '}
                de <span className="font-semibold text-fg">{total.toLocaleString('pt-BR')}</span>
                {filtered ? (total === 1 ? ' resultado' : ' resultados') : total === 1 ? ' produto' : ' produtos'}
              </p>
              {/* celular: paginação + itens por página na mesma linha (no sm+ o seletor fica na barra de filtros) */}
              <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
                <Pagination
                  page={data.page}
                  pageCount={data.pageCount}
                  onPageChange={goToPage}
                  className="shrink-0 max-sm:-ml-2"
                />
                <div className="ml-auto w-full max-w-36 min-w-0 sm:hidden">
                  <Select
                    aria-label="Itens por página"
                    value={String(filters.pageSize)}
                    onChange={(e) => updateFilters({ pageSize: Number(e.currentTarget.value) })}
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n} itens
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <BulkActionsBar
        count={selectedIds.size}
        activeCount={activeSelected}
        inactiveCount={inactiveSelected}
        busy={bulkBusy}
        onActivate={() => void bulkSetStatus('active')}
        onDeactivate={() => void bulkSetStatus('inactive')}
        onDelete={() => setBulkDelete({ open: true, products: selectedProducts })}
        onClear={clearSelection}
      />

      <DeleteProductDialog
        open={deleteState.open}
        onOpenChange={(open) => setDeleteState((prev) => ({ ...prev, open }))}
        product={deleteState.product}
        onConfirm={confirmDelete}
      />

      <DeleteProductsDialog
        open={bulkDelete.open}
        onOpenChange={(open) => setBulkDelete((prev) => ({ ...prev, open }))}
        products={bulkDelete.products}
        onConfirm={confirmBulkDelete}
      />
    </div>
  )
}
