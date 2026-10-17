/**
 * Peças compartilhadas entre a tabela (desktop) e a lista (mobile) de produtos.
 */
import { ArrowUpRight, LoaderCircle, Pencil, Star, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { ProductImage } from '@/components/catalog/product-image'
import { buttonVariants } from '@/components/ui/button-variants'
import { appHref } from '@/lib/base-path'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/catalog'
import { FROM_LIST_STATE } from './products-params'

export function ProductThumb({
  product,
  className,
  sizes = '48px',
}: {
  product: Pick<Product, 'images' | 'name'>
  className?: string
  sizes?: string
}) {
  return (
    <div
      className={cn(
        'relative aspect-[5/6] w-11 shrink-0 overflow-hidden rounded-lg bg-surface-2 ring-1 ring-black/[0.05] dark:ring-white/[0.07]',
        className,
      )}
    >
      <ProductImage path={product.images[0]} alt="" sizes={sizes} />
    </div>
  )
}

export function StatusToggle({
  product,
  pending,
  onToggle,
  className,
}: {
  product: Product
  pending: boolean
  onToggle: (product: Product) => void
  className?: string
}) {
  const active = product.status === 'active'
  const action = active ? `Inativar ${product.name}` : `Ativar ${product.name}`
  return (
    <button
      type="button"
      onClick={() => onToggle(product)}
      disabled={pending}
      aria-label={`${active ? 'Ativo' : 'Inativo'} — ${action}`}
      title={active ? 'Ativo na loja · clique para inativar' : 'Oculto da loja · clique para ativar'}
      className={cn(
        'group/status inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[0.6875rem] font-semibold tracking-wide whitespace-nowrap',
        'ring-1 ring-transparent transition-[background-color,box-shadow,color,opacity] duration-200 ease-out-expo',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-wait disabled:opacity-60',
        active
          ? 'bg-emerald-500/12 text-emerald-700 hover:ring-emerald-500/40 dark:text-emerald-400'
          : 'bg-surface-2 text-muted hover:text-fg hover:ring-line-strong',
        className,
      )}
    >
      {pending ? (
        <LoaderCircle className="size-3 animate-spin" aria-hidden />
      ) : (
        <span
          className={cn(
            'size-1.5 rounded-full transition-transform duration-300 ease-out-expo group-hover/status:scale-125',
            active ? 'bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129/0.18)]' : 'bg-subtle',
          )}
          aria-hidden
        />
      )}
      {active ? 'Ativo' : 'Inativo'}
    </button>
  )
}

export function FeaturedToggle({
  product,
  pending,
  onToggle,
  className,
}: {
  product: Product
  pending: boolean
  onToggle: (product: Product) => void
  className?: string
}) {
  const on = product.isFeatured
  return (
    <button
      type="button"
      onClick={() => onToggle(product)}
      disabled={pending}
      aria-pressed={on}
      aria-label={`Destaque: ${product.name}`}
      title={on ? 'Em destaque · clique para remover' : 'Clique para destacar no carrossel'}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full transition-[background-color,color,transform] duration-200 ease-out-expo',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 active:scale-90 disabled:cursor-wait disabled:opacity-60',
        on ? 'text-brand-500 hover:bg-brand-500/10' : 'text-subtle hover:bg-surface-2 hover:text-fg',
        className,
      )}
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : (
        <Star
          className={cn('size-[1.15rem] transition-transform duration-300 ease-out-expo', on && 'scale-110 fill-current')}
          aria-hidden
        />
      )}
    </button>
  )
}

export function RowActions({
  product,
  onDelete,
  size = 'icon-sm',
  className,
}: {
  product: Product
  onDelete: (product: Product) => void
  size?: 'icon' | 'icon-sm'
  className?: string
}) {
  const iconBtn = buttonVariants({ variant: 'ghost', size, className: 'text-muted hover:text-fg' })
  return (
    <div className={cn('flex items-center justify-end gap-0.5', className)}>
      <Link
        to={`/admin/produtos/${product.id}`}
        state={FROM_LIST_STATE}
        className={iconBtn}
        aria-label={`Editar ${product.name}`}
        title="Editar"
      >
        <Pencil aria-hidden />
      </Link>
      <a
        href={appHref(`/produto/${product.id}`)}
        target="_blank"
        rel="noreferrer"
        className={iconBtn}
        aria-label={`Ver ${product.name} na loja (abre em nova aba)`}
        title={product.status === 'active' ? 'Ver na loja' : 'Ver na loja (produto inativo)'}
      >
        <ArrowUpRight aria-hidden />
      </a>
      <button
        type="button"
        onClick={() => onDelete(product)}
        className={buttonVariants({
          variant: 'ghost',
          size,
          className: 'text-muted hover:bg-red-500/10 hover:text-danger-500',
        })}
        aria-label={`Excluir ${product.name}`}
        title="Excluir"
      >
        <Trash2 aria-hidden />
      </button>
    </div>
  )
}
