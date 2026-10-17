import { memo } from 'react'
import { Link } from 'react-router'
import { tableStyles } from '@/components/admin/table-styles'
import { Price } from '@/components/catalog/price'
import { Checkbox } from '@/components/ui/form'
import { cn, formatDate, productCode } from '@/lib/utils'
import type { Product } from '@/types/catalog'
import { FeaturedToggle, ProductThumb, RowActions, StatusToggle } from './product-cells'
import { FROM_LIST_STATE } from './products-params'
import type { ProductQuickActions } from './use-product-quick-actions'

const COL = {
  check: 'w-12 pr-0',
  category: 'hidden xl:table-cell',
  distributor: 'hidden xl:table-cell',
  created: 'hidden 2xl:table-cell',
}

export interface ProductsTableProps {
  items: Product[]
  categoryName: (id: string) => string
  distributorName: (id: string) => string
  selectedIds: ReadonlySet<string>
  onToggleSelect: (id: string) => void
  onToggleAll: (checked: boolean) => void
  actions: ProductQuickActions
  onDelete: (product: Product) => void
  /** resultado anterior exibido enquanto a nova página/filtro carrega */
  stale?: boolean
}

export function ProductsTable({
  items,
  categoryName,
  distributorName,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  actions,
  onDelete,
  stale = false,
}: ProductsTableProps) {
  const selectedOnPage = items.reduce((n, p) => n + (selectedIds.has(p.id) ? 1 : 0), 0)
  const allSelected = items.length > 0 && selectedOnPage === items.length
  const someSelected = selectedOnPage > 0 && !allSelected

  return (
    <div className={tableStyles.wrapper}>
      <table className={tableStyles.table} aria-busy={stale || undefined}>
        <caption className="sr-only">Lista de produtos</caption>
        <thead>
          <tr>
            <th scope="col" className={cn(tableStyles.th, COL.check)}>
              <Checkbox
                ref={(el) => {
                  if (el) el.indeterminate = someSelected
                }}
                checked={allSelected}
                onChange={(e) => onToggleAll(e.currentTarget.checked)}
                aria-label="Selecionar todos os produtos desta página"
                className="-m-2 p-2"
              />
            </th>
            <th scope="col" className={tableStyles.th}>
              Produto
            </th>
            <th scope="col" className={cn(tableStyles.th, COL.category)}>
              Categoria
            </th>
            <th scope="col" className={cn(tableStyles.th, COL.distributor)}>
              Distribuidor
            </th>
            <th scope="col" className={tableStyles.th}>
              Preço
            </th>
            <th scope="col" className={tableStyles.th}>
              Status
            </th>
            <th scope="col" className={cn(tableStyles.th, 'text-center')}>
              Destaque
            </th>
            <th scope="col" className={cn(tableStyles.th, COL.created)}>
              Criado em
            </th>
            <th scope="col" className={cn(tableStyles.th, 'text-right')}>
              Ações
            </th>
          </tr>
        </thead>
        <tbody className={cn('transition-opacity duration-200 ease-out-expo', stale && 'opacity-55')}>
          {items.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              selected={selectedIds.has(product.id)}
              categoryName={categoryName(product.category)}
              distributorName={distributorName(product.distributor)}
              statusPending={actions.isPending(product.id, 'status')}
              featuredPending={actions.isPending(product.id, 'featured')}
              onToggleSelect={onToggleSelect}
              onToggleStatus={actions.toggleStatus}
              onToggleFeatured={actions.toggleFeatured}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface ProductRowProps {
  product: Product
  selected: boolean
  categoryName: string
  distributorName: string
  statusPending: boolean
  featuredPending: boolean
  onToggleSelect: (id: string) => void
  onToggleStatus: (product: Product) => void
  onToggleFeatured: (product: Product) => void
  onDelete: (product: Product) => void
}

const ProductRow = memo(function ProductRow({
  product,
  selected,
  categoryName,
  distributorName,
  statusPending,
  featuredPending,
  onToggleSelect,
  onToggleStatus,
  onToggleFeatured,
  onDelete,
}: ProductRowProps) {
  const td = tableStyles.td
  return (
    <tr
      className={cn(
        tableStyles.tr,
        selected && 'bg-brand-500/[0.045] hover:bg-brand-500/[0.07] dark:bg-brand-500/[0.08] dark:hover:bg-brand-500/[0.11]',
      )}
    >
      <td className={cn(td, COL.check)}>
        <Checkbox
          checked={selected}
          onChange={() => onToggleSelect(product.id)}
          aria-label={`Selecionar ${product.name}`}
          className="-m-2 p-2"
        />
      </td>
      <td className={cn(td, 'min-w-[15rem]')}>
        <div className="flex items-center gap-3">
          <ProductThumb product={product} />
          <div className="min-w-0">
            <Link
              to={`/admin/produtos/${product.id}`}
              state={FROM_LIST_STATE}
              className="line-clamp-2 leading-snug font-semibold text-fg transition-colors duration-200 hover:text-brand-600 focus-visible:rounded-sm dark:hover:text-brand-400"
            >
              {product.name}
            </Link>
            <p className="mt-0.5 truncate text-xs text-subtle">
              <span className="font-medium tabular-nums">{productCode(product.id)}</span>
              <span className="xl:hidden">
                {' · '}
                {categoryName} · {distributorName}
              </span>
            </p>
          </div>
        </div>
      </td>
      <td className={cn(td, COL.category, 'whitespace-nowrap text-muted')}>{categoryName}</td>
      <td className={cn(td, COL.distributor, 'whitespace-nowrap text-muted')}>{distributorName}</td>
      <td className={cn(td, 'whitespace-nowrap')}>
        <Price internal product={product} size="sm" className="flex-col items-start gap-y-0" />
      </td>
      <td className={td}>
        <StatusToggle product={product} pending={statusPending} onToggle={onToggleStatus} />
      </td>
      <td className={cn(td, 'text-center')}>
        <FeaturedToggle product={product} pending={featuredPending} onToggle={onToggleFeatured} />
      </td>
      <td className={cn(td, COL.created, 'whitespace-nowrap text-muted tabular-nums')}>
        <time dateTime={product.createdAt}>{formatDate(product.createdAt)}</time>
      </td>
      <td className={cn(td, 'pr-3')}>
        <RowActions product={product} onDelete={onDelete} />
      </td>
    </tr>
  )
})

/** Esqueleto da tabela com as mesmas colunas (carregamento inicial). */
export function ProductsTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className={tableStyles.wrapper} aria-hidden>
      <table className={tableStyles.table}>
        <thead>
          <tr>
            <th className={cn(tableStyles.th, COL.check)}>
              <span className="skeleton block size-[1.125rem] rounded-md" />
            </th>
            <th className={tableStyles.th}>Produto</th>
            <th className={cn(tableStyles.th, COL.category)}>Categoria</th>
            <th className={cn(tableStyles.th, COL.distributor)}>Distribuidor</th>
            <th className={tableStyles.th}>Preço</th>
            <th className={tableStyles.th}>Status</th>
            <th className={cn(tableStyles.th, 'text-center')}>Destaque</th>
            <th className={cn(tableStyles.th, COL.created)}>Criado em</th>
            <th className={cn(tableStyles.th, 'text-right')}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i}>
              <td className={cn(tableStyles.td, COL.check)}>
                <span className="skeleton block size-[1.125rem] rounded-md" />
              </td>
              <td className={tableStyles.td}>
                <div className="flex items-center gap-3">
                  <span className="skeleton block aspect-[5/6] w-11 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <span className="skeleton block h-3.5 rounded-full" style={{ width: `${55 + ((i * 17) % 35)}%` }} />
                    <span className="skeleton block h-3 w-16 rounded-full" />
                  </div>
                </div>
              </td>
              <td className={cn(tableStyles.td, COL.category)}>
                <span className="skeleton block h-3.5 w-20 rounded-full" />
              </td>
              <td className={cn(tableStyles.td, COL.distributor)}>
                <span className="skeleton block h-3.5 w-24 rounded-full" />
              </td>
              <td className={tableStyles.td}>
                <span className="skeleton block h-4 w-16 rounded-full" />
              </td>
              <td className={tableStyles.td}>
                <span className="skeleton block h-7 w-16 rounded-full" />
              </td>
              <td className={tableStyles.td}>
                <span className="skeleton mx-auto block size-6 rounded-full" />
              </td>
              <td className={cn(tableStyles.td, COL.created)}>
                <span className="skeleton block h-3.5 w-20 rounded-full" />
              </td>
              <td className={tableStyles.td}>
                <span className="skeleton ml-auto block h-7 w-24 rounded-full" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
