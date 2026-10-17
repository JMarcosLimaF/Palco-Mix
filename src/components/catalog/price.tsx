import { cn, discountPercent, effectivePrice, formatBRL, hasPromo, isPriceOnRequest } from '@/lib/utils'
import type { Product } from '@/types/catalog'

export interface PriceProps {
  product: Pick<Product, 'price' | 'promoPrice'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** exibe o selo "-X%" ao lado */
  showDiscount?: boolean
}

/** Bloco de preço: preço efetivo em destaque + preço "de" riscado quando há promoção. */
export function Price({ product, size = 'md', className, showDiscount = false }: PriceProps) {
  if (isPriceOnRequest(product)) {
    return (
      <div className={cn('flex items-baseline gap-2', className)}>
        <span
          className={cn(
            'font-bold tracking-tight text-fg',
            size === 'sm' && 'text-[0.95rem]',
            size === 'md' && 'text-lg',
            size === 'lg' && 'text-3xl',
          )}
        >
          Sob consulta
        </span>
        {size !== 'sm' && <span className="text-xs text-subtle">via WhatsApp</span>}
      </div>
    )
  }
  const promo = hasPromo(product)
  const off = discountPercent(product)
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span
        className={cn(
          'font-extrabold tracking-tight tabular-nums text-fg',
          size === 'sm' && 'text-[0.95rem]',
          size === 'md' && 'text-lg',
          size === 'lg' && 'text-3xl',
        )}
      >
        <span className="sr-only">{promo ? 'Preço promocional: ' : 'Preço: '}</span>
        {formatBRL(effectivePrice(product))}
      </span>
      {promo && (
        <span className={cn('text-subtle tabular-nums line-through', size === 'lg' ? 'text-base' : 'text-xs')}>
          <span className="sr-only">Preço original: </span>
          {formatBRL(product.price)}
        </span>
      )}
      {promo && showDiscount && off > 0 && (
        <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-brand-600 dark:text-brand-400">
          -{off}%
        </span>
      )}
    </div>
  )
}
