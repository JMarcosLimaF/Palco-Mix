import { memo } from 'react'
import { Link } from 'react-router'
import { Price } from '@/components/catalog/price'
import { Checkbox } from '@/components/ui/form'
import { cn, productCode } from '@/lib/utils'
import type { Product } from '@/types/catalog'
import { FeaturedToggle, ProductThumb, RowActions, StatusToggle } from './product-cells'
import { FROM_LIST_STATE } from './products-params'
import type { ProductQuickActions } from './use-product-quick-actions'

export interface ProductsMobileListProps {
  items: Product[]
  categoryName: (id: string) => string
  distributorName: (id: string) => string
  selectedIds: ReadonlySet<string>
  onToggleSelect: (id: string) => void
  /** marca/desmarca todos os itens da página */
  onToggleAll: (checked: boolean) => void
  actions: ProductQuickActions
  onDelete: (product: Product) => void
  stale?: boolean
}

/** Lista compacta de produtos para telas < md (mesmas ações da tabela). */
export function ProductsMobileList({
  items,
  categoryName,
  distributorName,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  actions,
  onDelete,
  stale = false,
}: ProductsMobileListProps) {
  const selectedCount = items.reduce((n, p) => (selectedIds.has(p.id) ? n + 1 : n), 0)
  const allSelected = items.length > 0 && selectedCount === items.length
  return (
    <div>
      {/* seleção em lote no celular: marcar a página inteira de uma vez */}
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-line bg-surface/50 px-4">
        <Checkbox
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = selectedCount > 0 && !allSelected
          }}
          onChange={(e) => onToggleAll(e.currentTarget.checked)}
          aria-label={allSelected ? 'Desmarcar todos os produtos desta página' : 'Selecionar todos os produtos desta página'}
          label={<span className="text-[0.8125rem] font-semibold text-muted">Selecionar todos</span>}
          className="-ml-3 h-12 px-3"
        />
        <span className="text-xs text-subtle tabular-nums">
          {selectedCount > 0
            ? `${selectedCount.toLocaleString('pt-BR')} de ${items.length.toLocaleString('pt-BR')}`
            : `${items.length.toLocaleString('pt-BR')} nesta página`}
        </span>
      </div>
      <ul
        aria-label="Lista de produtos"
        aria-busy={stale || undefined}
        className={cn('divide-y divide-line transition-opacity duration-200 ease-out-expo', stale && 'opacity-55')}
      >
        {items.map((product) => (
          <MobileItem
            key={product.id}
            product={product}
            selected={selectedIds.has(product.id)}
            meta={`${categoryName(product.category)} · ${distributorName(product.distributor)}`}
            statusPending={actions.isPending(product.id, 'status')}
            featuredPending={actions.isPending(product.id, 'featured')}
            onToggleSelect={onToggleSelect}
            onToggleStatus={actions.toggleStatus}
            onToggleFeatured={actions.toggleFeatured}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  )
}

interface MobileItemProps {
  product: Product
  selected: boolean
  meta: string
  statusPending: boolean
  featuredPending: boolean
  onToggleSelect: (id: string) => void
  onToggleStatus: (product: Product) => void
  onToggleFeatured: (product: Product) => void
  onDelete: (product: Product) => void
}

const MobileItem = memo(function MobileItem({
  product,
  selected,
  meta,
  statusPending,
  featuredPending,
  onToggleSelect,
  onToggleStatus,
  onToggleFeatured,
  onDelete,
}: MobileItemProps) {
  const href = `/admin/produtos/${product.id}`
  return (
    // grade: [seleção] [foto] [dados]; a linha de ações começa embaixo da foto (largura para alvos de 40px)
    <li
      className={cn(
        'grid grid-cols-[auto_auto_minmax(0,1fr)] gap-x-3 px-4 pt-3.5 pb-2.5 transition-colors duration-200',
        selected && 'bg-brand-500/[0.05] dark:bg-brand-500/[0.09]',
      )}
    >
      <Checkbox
        checked={selected}
        onChange={() => onToggleSelect(product.id)}
        aria-label={`Selecionar ${product.name}`}
        className="-mt-1.5 -mr-2 -ml-3 self-start p-3"
      />
      <Link to={href} state={FROM_LIST_STATE} tabIndex={-1} aria-hidden className="self-start">
        <ProductThumb product={product} className="w-16 rounded-xl" sizes="64px" />
      </Link>
      <div className="min-w-0">
        <div className="flex items-start gap-1">
          <div className="min-w-0 flex-1">
            <Link
              to={href}
              state={FROM_LIST_STATE}
              className="line-clamp-2 text-sm leading-snug font-semibold text-fg transition-colors active:text-brand-600"
            >
              {product.name}
            </Link>
            <p className="mt-0.5 line-clamp-2 text-xs text-subtle">
              <span className="font-medium tabular-nums">{productCode(product.id)}</span> · {meta}
            </p>
          </div>
          <FeaturedToggle
            product={product}
            pending={featuredPending}
            onToggle={onToggleFeatured}
            className="-mt-2.5 -mr-2 size-10"
          />
        </div>
        <Price internal product={product} size="sm" className="mt-1.5" />
      </div>
      <div className="col-span-2 col-start-2 mt-2 flex items-center justify-between gap-2">
        <StatusToggle
          product={product}
          pending={statusPending}
          onToggle={onToggleStatus}
          className="h-10 px-3.5 text-xs"
        />
        <RowActions product={product} onDelete={onDelete} size="icon" className="-mr-2 gap-1.5" />
      </div>
    </li>
  )
})

export function ProductsMobileListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-hidden>
      <div className="flex h-12 items-center justify-between border-b border-line bg-surface/50 px-4">
        <span className="skeleton block h-4 w-36 rounded-full" />
        <span className="skeleton block h-3 w-20 rounded-full" />
      </div>
      <ul className="divide-y divide-line">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-x-3 px-4 pt-3.5 pb-2.5">
            <span className="skeleton mt-1.5 block size-[1.125rem] rounded-md" />
            <span className="skeleton block aspect-[5/6] w-16 rounded-xl" />
            <div className="space-y-2 pt-0.5">
              <span className="skeleton block h-3.5 w-11/12 rounded-full" />
              <span className="skeleton block h-3 w-1/2 rounded-full" />
              <span className="skeleton block h-4 w-20 rounded-full" />
            </div>
            <div className="col-span-2 col-start-2 mt-2 flex items-center justify-between">
              <span className="skeleton block h-10 w-20 rounded-full" />
              <span className="skeleton block h-10 w-32 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
