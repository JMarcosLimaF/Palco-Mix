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
  actions,
  onDelete,
  stale = false,
}: ProductsMobileListProps) {
  return (
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
    <li className={cn('flex gap-3 px-4 py-4 transition-colors duration-200', selected && 'bg-brand-500/[0.05] dark:bg-brand-500/[0.09]')}>
      <Checkbox
        checked={selected}
        onChange={() => onToggleSelect(product.id)}
        aria-label={`Selecionar ${product.name}`}
        className="-m-2 self-start p-2 pt-3"
      />
      <Link to={href} state={FROM_LIST_STATE} tabIndex={-1} aria-hidden className="self-start">
        <ProductThumb product={product} className="w-16 rounded-xl" sizes="72px" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1">
          <div className="min-w-0 flex-1">
            <Link
              to={href}
              state={FROM_LIST_STATE}
              className="line-clamp-2 text-sm leading-snug font-semibold text-fg transition-colors active:text-brand-600"
            >
              {product.name}
            </Link>
            <p className="mt-0.5 truncate text-xs text-subtle">
              <span className="font-medium tabular-nums">{productCode(product.id)}</span> · {meta}
            </p>
          </div>
          <FeaturedToggle
            product={product}
            pending={featuredPending}
            onToggle={onToggleFeatured}
            className="-mt-2 -mr-2 size-10"
          />
        </div>
        <Price product={product} size="sm" className="mt-1.5" />
        <div className="mt-2 flex items-center justify-between gap-2">
          <StatusToggle product={product} pending={statusPending} onToggle={onToggleStatus} />
          <div className="-mr-2">
            <RowActions product={product} onDelete={onDelete} size="icon" />
          </div>
        </div>
      </div>
    </li>
  )
})

export function ProductsMobileListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul aria-hidden className="divide-y divide-line">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex gap-3 px-4 py-4">
          <span className="skeleton mt-1 block size-[1.125rem] rounded-md" />
          <span className="skeleton block aspect-[5/6] w-16 rounded-xl" />
          <div className="flex-1 space-y-2 pt-0.5">
            <span className="skeleton block h-3.5 w-11/12 rounded-full" />
            <span className="skeleton block h-3 w-1/2 rounded-full" />
            <span className="skeleton block h-4 w-20 rounded-full" />
            <div className="flex justify-between pt-1">
              <span className="skeleton block h-7 w-16 rounded-full" />
              <span className="skeleton block h-7 w-24 rounded-full" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
