import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { LogoMark } from '@/components/brand/logo'
import { ProductImage } from '@/components/catalog/product-image'
import { buttonVariants } from '@/components/ui/button-variants'
import { catalogHref } from '@/lib/catalog-params'
import { pluralize } from '@/lib/utils'
import type { Distributor, Product } from '@/types/catalog'

const THUMB_SIZES = '(min-width: 1024px) 130px, (min-width: 640px) 15vw, 30vw'
const MOSAIC_SLOTS = [0, 1, 2] as const

export interface DistributorCardProps {
  distributor: Distributor
  count: number
  /** até 3 produtos (mais recentes) para o mosaico */
  preview: readonly Product[]
  priority?: boolean
}

/** Card de marca: nome em destaque, contagem, mosaico de miniaturas e CTA (o card inteiro é clicável). */
export function DistributorCard({ distributor, count, preview, priority = false }: DistributorCardProps) {
  return (
    <article className="group relative flex h-full flex-col rounded-3xl border border-line bg-elevated p-5 shadow-card transition-[box-shadow,translate,border-color] duration-500 ease-out-expo hover:-translate-y-1 hover:border-line-strong hover:shadow-card-hover sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow text-brand-600 tabular-nums dark:text-brand-400">
            {count > 0 ? pluralize(count, 'produto', 'produtos') : 'Sem produtos no momento'}
          </p>
          <h2 className="title-display mt-2 text-3xl break-words sm:text-4xl">{distributor.name}</h2>
        </div>
        <span
          aria-hidden
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-fg transition-[background-color,color,rotate] duration-300 ease-out-expo group-hover:rotate-45 group-hover:bg-brand-500 group-hover:text-white"
        >
          <ArrowUpRight className="size-[1.1rem]" />
        </span>
      </div>

      {distributor.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{distributor.description}</p>
      )}

      <div aria-hidden className="mt-5 grid grid-cols-3 gap-2">
        {MOSAIC_SLOTS.map((slot) => {
          const product = preview[slot]
          return (
            <div
              key={slot}
              className="relative aspect-[5/6] overflow-hidden rounded-xl bg-surface-2 ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
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

      <div className="mt-auto pt-6">
        <Link
          to={catalogHref({ distributors: [distributor.id] })}
          aria-label={`Ver produtos: ${distributor.name}`}
          className={buttonVariants({
            variant: 'secondary',
            size: 'md',
            // o ::after estica o link sobre o card inteiro (um único alvo acessível)
            className: 'w-full after:absolute after:inset-0 after:rounded-3xl after:content-[""]',
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
    <div aria-hidden className="rounded-3xl border border-line bg-elevated p-5 sm:p-6">
      <div className="skeleton h-3 w-20 rounded-full" />
      <div className="skeleton mt-3 h-9 w-2/3 rounded-full" />
      <div className="skeleton mt-4 h-4 w-4/5 rounded-full" />
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="skeleton aspect-[5/6] rounded-xl" />
        <div className="skeleton aspect-[5/6] rounded-xl" />
        <div className="skeleton aspect-[5/6] rounded-xl" />
      </div>
      <div className="skeleton mt-6 h-11 w-full rounded-full" />
    </div>
  )
}
