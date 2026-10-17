import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { LogoMark } from '@/components/brand/logo'
import { ProductImage } from '@/components/catalog/product-image'
import { buttonVariants } from '@/components/ui/button-variants'
import { catalogHref } from '@/lib/catalog-params'
import { cn, pluralize } from '@/lib/utils'
import type { Distributor, Product } from '@/types/catalog'

// celular: 1 miniatura na largura do card (2 colunas); sm+: mosaico de 3
const THUMB_SIZES = '(min-width: 1024px) 130px, (min-width: 640px) 15vw, 40vw'
const MOSAIC_SLOTS = [0, 1, 2] as const

// o ::after estica o link sobre o card inteiro (um único alvo acessível)
const STRETCHED_LINK = 'after:absolute after:inset-0 after:rounded-2xl after:content-[""] sm:after:rounded-3xl'

export interface DistributorCardProps {
  distributor: Distributor
  count: number
  /** até 3 produtos (mais recentes) para o mosaico */
  preview: readonly Product[]
  priority?: boolean
}

/**
 * Card de marca: nome em destaque, contagem, mosaico de miniaturas e CTA (o card inteiro é clicável).
 * No celular (grade de 2 colunas) fica compacto: a arte mais recente no topo, nome, contagem e link.
 */
export function DistributorCard({ distributor, count, preview, priority = false }: DistributorCardProps) {
  const href = catalogHref({ distributors: [distributor.id] })
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-elevated p-2.5 shadow-card transition-[box-shadow,translate,border-color] duration-500 ease-out-expo hover:-translate-y-1 hover:border-line-strong hover:shadow-card-hover sm:rounded-3xl sm:p-6">
      <div className="flex items-start justify-between gap-4 px-1.5 pt-3 sm:p-0">
        <div className="min-w-0">
          <p className="eyebrow text-brand-600 tabular-nums dark:text-brand-400">
            {count > 0 ? pluralize(count, 'produto', 'produtos') : 'Sem produtos no momento'}
          </p>
          <h2 className="title-display mt-1 text-xl break-words sm:mt-2 sm:text-4xl">{distributor.name}</h2>
        </div>
        <span
          aria-hidden
          className="hidden size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-fg transition-[background-color,color,rotate] duration-300 ease-out-expo group-hover:rotate-45 group-hover:bg-brand-500 group-hover:text-white sm:inline-flex"
        >
          <ArrowUpRight className="size-[1.1rem]" />
        </span>
      </div>

      {distributor.description && (
        <p className="mt-3 hidden text-sm leading-relaxed text-muted sm:line-clamp-2">{distributor.description}</p>
      )}

      <div aria-hidden className="order-first grid grid-cols-1 gap-2 sm:order-none sm:mt-5 sm:grid-cols-3">
        {MOSAIC_SLOTS.map((slot) => {
          const product = preview[slot]
          return (
            <div
              key={slot}
              className={cn(
                'relative aspect-[5/6] overflow-hidden rounded-xl bg-surface-2 ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
                slot > 0 && 'hidden sm:block',
              )}
            >
              {product ? (
                <ProductImage
                  path={product.images[0]}
                  alt=""
                  sizes={THUMB_SIZES}
                  priority={priority}
                  className="transition-[opacity,scale] duration-700 ease-out-expo group-hover:scale-[1.06]"
                  style={{ transitionDelay: `${slot * 40}ms` }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <LogoMark className="h-6 text-line-strong opacity-70" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-auto px-1.5 pt-1 sm:p-0 sm:pt-6">
        {/* um link por layout (o outro fica display:none, fora da árvore de acessibilidade) */}
        <Link
          to={href}
          aria-label={`Ver produtos: ${distributor.name}`}
          className={cn(
            'inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-600 sm:hidden dark:text-brand-400',
            STRETCHED_LINK,
          )}
        >
          Ver produtos
          <ArrowRight aria-hidden className="size-4" />
        </Link>
        <Link
          to={href}
          aria-label={`Ver produtos: ${distributor.name}`}
          className={buttonVariants({
            variant: 'secondary',
            size: 'md',
            className: cn('hidden w-full sm:inline-flex', STRETCHED_LINK),
          })}
        >
          Ver produtos
          <ArrowRight
            aria-hidden
            className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </article>
  )
}

export function DistributorCardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col rounded-2xl border border-line bg-elevated p-2.5 sm:block sm:rounded-3xl sm:p-6">
      <div className="skeleton aspect-[5/6] rounded-xl sm:hidden" />
      <div className="px-1.5 pt-3 sm:p-0">
        <div className="skeleton h-3 w-20 rounded-full" />
        <div className="skeleton mt-3 h-6 w-2/3 rounded-full sm:h-9" />
      </div>
      <div className="skeleton mt-4 hidden h-4 w-4/5 rounded-full sm:block" />
      <div className="mt-5 hidden grid-cols-3 gap-2 sm:grid">
        <div className="skeleton aspect-[5/6] rounded-xl" />
        <div className="skeleton aspect-[5/6] rounded-xl" />
        <div className="skeleton aspect-[5/6] rounded-xl" />
      </div>
      <div className="skeleton mx-1.5 mt-4 h-4 w-1/2 rounded-full sm:mx-0 sm:mt-6 sm:h-11 sm:w-full" />
    </div>
  )
}
