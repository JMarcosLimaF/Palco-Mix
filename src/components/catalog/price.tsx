import { site } from '@/config/site'
import { cn, effectivePrice, formatBRL, hasPromo, isPriceOnRequest } from '@/lib/utils'
import type { Product } from '@/types/catalog'
import { discountBadgeLabel } from './catalog-helpers'

export interface PriceProps {
  /** painel admin: mostra o preço mesmo com a loja sem preços (site.showPrices = false) */
  internal?: boolean
  product: Pick<Product, 'price' | 'promoPrice'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** exibe o selo "-X% à vista" ao lado (só a partir de 10%) */
  showDiscount?: boolean
}

/**
 * Bloco de preço. `promoPrice` é o preço À VISTA e `price` o preço A PRAZO
 * (continua valendo no cartão — por isso não é riscado).
 * A ordem dos filhos diretos (preço · a prazo · selo) é usada pelo HERO_PRICE_CLASS da Home.
 */
export function Price({ product, size = 'md', className, showDiscount = false, internal = false }: PriceProps) {
  if (!site.showPrices && !internal) return null
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
  const cash = hasPromo(product)
  const badge = showDiscount ? discountBadgeLabel(product) : null
  // sufixos visíveis ("à vista"/"a prazo"); o leitor de tela ouve o prefixo sr-only
  const suffix = cn('font-semibold tracking-normal', size === 'lg' ? 'text-sm' : 'text-xs')
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
        <span className="sr-only">{cash ? 'Preço à vista: ' : 'Preço: '}</span>
        {formatBRL(effectivePrice(product))}
        {cash && (
          <span className={cn(suffix, 'ml-1 opacity-70')} aria-hidden>
            à vista
          </span>
        )}
      </span>
      {cash && (
        <span className={cn('text-subtle tabular-nums', size === 'lg' ? 'text-base' : 'text-xs')}>
          <span className="sr-only">Preço a prazo: </span>
          {formatBRL(product.price)}
          <span className={cn(suffix, 'ml-1')} aria-hidden>
            a prazo
          </span>
        </span>
      )}
      {badge && (
        <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-brand-600 dark:text-brand-400">
          {badge}
        </span>
      )}
    </div>
  )
}
