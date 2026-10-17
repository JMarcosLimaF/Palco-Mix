import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { ProductImage } from '@/components/catalog/product-image'
import { Badge } from '@/components/ui/badge'
import { catalogHref } from '@/lib/catalog-params'
import { pluralize } from '@/lib/utils'
import type { Category } from '@/types/catalog'

const COVER_SIZES = '(min-width: 1024px) 300px, (min-width: 640px) 40vw, 70vw'

export interface CategoryCardProps {
  category: Category
  count: number
  cover: string | undefined
  /** cards da primeira linha (acima da dobra) */
  priority?: boolean
}

/** Card grande de /categorias: capa como pôster sobre a própria arte desfocada. */
export function CategoryCard({ category, count, cover, priority = false }: CategoryCardProps) {
  return (
    <Link
      to={catalogHref({ categories: [category.id] })}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-elevated shadow-card transition-[box-shadow,translate,border-color] duration-500 ease-out-expo hover:-translate-y-1 hover:border-line-strong hover:shadow-card-hover focus-visible:outline-offset-4"
    >
      <div className="relative isolate aspect-[4/3] overflow-hidden bg-surface-2">
        <ProductImage
          path={cover}
          alt=""
          aria-hidden
          fit="cover"
          sizes={COVER_SIZES}
          priority={priority}
          className="-z-10 scale-[1.4] transform-gpu opacity-70 blur-2xl saturate-150 dark:opacity-45"
        />
        <div className="absolute inset-0 flex items-center justify-center p-5 sm:p-6">
          <div className="relative aspect-[5/6] h-full max-w-full overflow-hidden rounded-xl shadow-[0_30px_60px_-24px_rgb(13_13_13/0.55)] ring-1 ring-black/10 transition-[scale,rotate] duration-700 ease-out-expo group-hover:scale-[1.05] group-hover:-rotate-[1.5deg] dark:ring-white/10">
            <ProductImage path={cover} alt="" sizes={COVER_SIZES} priority={priority} />
          </div>
        </div>
        <Badge tone="glass" className="absolute top-4 left-4 tabular-nums">
          {count > 0 ? pluralize(count, 'produto', 'produtos') : 'Sem produtos no momento'}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="title-display min-w-0 text-2xl break-words sm:text-3xl">{category.name}</h2>
          <span
            aria-hidden
            className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-fg transition-[background-color,border-color,color,rotate] duration-300 ease-out-expo group-hover:-rotate-45 group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:text-white"
          >
            <ArrowRight className="size-[1.1rem]" />
          </span>
        </div>
        {category.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{category.description}</p>
        )}
        <span className="mt-auto pt-5 text-sm font-semibold text-brand-600 dark:text-brand-400">
          Ver produtos
        </span>
      </div>
    </Link>
  )
}

export function CategoryCardSkeleton() {
  return (
    <div aria-hidden className="overflow-hidden rounded-3xl border border-line bg-elevated">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="p-5 sm:p-6">
        <div className="skeleton h-7 w-1/2 rounded-full" />
        <div className="skeleton mt-3 h-4 w-4/5 rounded-full" />
        <div className="skeleton mt-6 h-4 w-1/3 rounded-full" />
      </div>
    </div>
  )
}
