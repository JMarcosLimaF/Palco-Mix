import { ArrowRight, PackagePlus, Pencil } from 'lucide-react'
import { m } from 'motion/react'
import { Link } from 'react-router'
import { Panel, PanelHeader } from '@/components/admin/ui'
import { Price } from '@/components/catalog/price'
import { ProductImage } from '@/components/catalog/product-image'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { EmptyState, Skeleton } from '@/components/ui/feedback'
import { cn, formatDate } from '@/lib/utils'
import type { Product } from '@/types/catalog'

const EASE = [0.16, 1, 0.3, 1] as const

export interface RecentProductsPanelProps {
  products: Product[] | undefined
  loading?: boolean
  /** id da categoria → nome */
  categoryName: (id: string) => string
  className?: string
}

/** Últimos produtos cadastrados com atalho para edição. */
export function RecentProductsPanel({ products, loading = false, categoryName, className }: RecentProductsPanelProps) {
  return (
    <Panel className={cn('flex flex-col overflow-hidden', className)}>
      <PanelHeader
        title="Adicionados recentemente"
        description="Os últimos produtos cadastrados no catálogo"
        actions={
          <Link
            to="/admin/produtos"
            className="group/all inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-semibold text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-fg"
          >
            Ver todos
            <ArrowRight
              className="size-3.5 transition-transform duration-300 ease-out-expo group-hover/all:translate-x-0.5"
              aria-hidden
            />
          </Link>
        }
      />

      {loading ? (
        <ul className="divide-y divide-line" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex items-center gap-3.5 px-5 py-3">
              <Skeleton className="aspect-[5/6] w-12 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/5 rounded-md" />
                <Skeleton className="h-3 w-2/5 rounded-md" />
              </div>
              <Skeleton className="hidden h-6 w-14 rounded-full sm:block" />
            </li>
          ))}
        </ul>
      ) : !products || products.length === 0 ? (
        <EmptyState
          className="py-12"
          icon={<PackagePlus className="size-7" aria-hidden />}
          title="Nenhum produto ainda"
          description="Cadastre o primeiro produto para ele aparecer aqui e na vitrine."
          action={
            <Link to="/admin/produtos/novo" className={buttonVariants({ size: 'sm' })}>
              Novo produto
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {products.map((product, i) => (
            <m.li
              key={product.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.05 * i, ease: EASE }}
            >
              <Link
                to={`/admin/produtos/${product.id}`}
                className="group/row flex items-center gap-3.5 px-5 py-3 transition-colors duration-200 outline-offset-[-2px] hover:bg-surface/80"
              >
                <div className="relative aspect-[5/6] w-12 shrink-0 overflow-hidden rounded-lg bg-surface-2 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                  <ProductImage path={product.images[0]} alt="" sizes="48px" />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="sr-only">Editar </span>
                  <span className="block truncate text-sm font-semibold text-fg transition-colors duration-200 group-hover/row:text-brand-600 dark:group-hover/row:text-brand-300">
                    {product.name}
                  </span>
                  <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-subtle">
                    <span className="truncate">{categoryName(product.category)}</span>
                    <span aria-hidden>·</span>
                    <span className="shrink-0">{formatDate(product.createdAt)}</span>
                  </span>
                  <Price product={product} size="sm" className="mt-1 sm:hidden" />
                </div>

                <Price product={product} size="sm" className="hidden shrink-0 flex-col items-end gap-0 sm:flex" />

                <Badge tone={product.status === 'active' ? 'success' : 'neutral'} className="shrink-0">
                  {product.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>

                <Pencil
                  className="hidden size-4 shrink-0 text-subtle transition-[color,transform] duration-200 group-hover/row:text-brand-500 sm:block"
                  aria-hidden
                />
              </Link>
            </m.li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
