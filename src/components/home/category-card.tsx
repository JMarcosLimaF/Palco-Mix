import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { ProductImage } from '@/components/catalog/product-image'
import { Badge } from '@/components/ui/badge'
import { catalogHref } from '@/lib/catalog-params'
import { pluralize } from '@/lib/utils'
import type { Category } from '@/types/catalog'

// celular: capa à esquerda (~38% da largura); sm+: capa no topo do card
const COVER_SIZES = '(min-width: 1024px) 300px, (min-width: 640px) 40vw, 30vw'

export interface CategoryCardProps {
  category: Category
  count: number
  cover: string | undefined
  /** cards da primeira linha (acima da dobra) */
  priority?: boolean
}

function countLabel(count: number) {
  return count > 0 ? pluralize(count, 'produto', 'produtos') : 'Sem produtos no momento'
}

/**
 * Card de /categorias: capa como pôster sobre a própria arte desfocada.
 * No celular vira uma linha compacta (capa à esquerda, texto à direita) — 7 categorias
 * cabem em pouco mais de uma tela, sem perder a descrição.
 */
export function CategoryCard({ category, count, cover, priority = false }: CategoryCardProps) {
  return (
    <Link
      to={catalogHref({ categories: [category.id] })}
      className="group flex h-full overflow-hidden rounded-2xl border border-line bg-elevated shadow-card transition-[box-shadow,translate,border-color] duration-500 ease-out-expo hover:-translate-y-1 hover:border-line-strong hover:shadow-card-hover focus-visible:outline-offset-4 sm:flex-col sm:rounded-3xl"
    >
      <div className="relative isolate w-[38%] max-w-40 shrink-0 overflow-hidden bg-surface-2 sm:aspect-[4/3] sm:w-auto sm:max-w-none">
        <ProductImage
          path={cover}
          alt=""
          aria-hidden
          fit="cover"
          sizes={COVER_SIZES}
          priority={priority}
          className="-z-10 scale-[1.4] transform-gpu opacity-70 blur-2xl saturate-150 dark:opacity-45"
        />
        <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
          <div className="relative aspect-[5/6] h-full max-w-full overflow-hidden rounded-lg shadow-[0_30px_60px_-24px_rgb(13_13_13/0.55)] ring-1 ring-black/10 transition-[scale,rotate] duration-700 ease-out-expo group-hover:scale-[1.05] group-hover:-rotate-[1.5deg] sm:rounded-xl dark:ring-white/10">
            <ProductImage path={cover} alt="" sizes={COVER_SIZES} priority={priority} />
          </div>
        </div>
        <Badge tone="glass" className="absolute top-4 left-4 hidden tabular-nums sm:inline-flex">
          {countLabel(count)}
        </Badge>
      </div>

      <div className="flex min-h-36 min-w-0 flex-1 flex-col p-4 sm:min-h-0 sm:p-6">
        <p className="eyebrow text-brand-600 tabular-nums sm:hidden dark:text-brand-400">{countLabel(count)}</p>
        <div className="mt-1.5 flex items-start justify-between gap-4 sm:mt-0">
          <h2 className="title-display min-w-0 text-[1.375rem] break-words sm:text-3xl">{category.name}</h2>
          <span
            aria-hidden
            className="mt-0.5 hidden size-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-fg transition-[background-color,border-color,color,rotate] duration-300 ease-out-expo group-hover:-rotate-45 group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:text-white sm:inline-flex"
          >
            <ArrowRight className="size-[1.1rem]" />
          </span>
        </div>
        {category.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted sm:mt-2">{category.description}</p>
        )}
        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-brand-600 sm:pt-5 dark:text-brand-400">
          Ver produtos
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 sm:hidden"
          />
        </span>
      </div>
    </Link>
  )
}

export function CategoryCardSkeleton() {
  return (
    <div aria-hidden className="flex overflow-hidden rounded-2xl border border-line bg-elevated sm:block sm:rounded-3xl">
      <div className="skeleton w-[38%] max-w-40 shrink-0 rounded-none sm:aspect-[4/3] sm:w-auto sm:max-w-none" />
      <div className="min-h-36 flex-1 p-4 sm:min-h-0 sm:p-6">
        <div className="skeleton h-3 w-20 rounded-full sm:hidden" />
        <div className="skeleton mt-2.5 h-7 w-1/2 rounded-full sm:mt-0" />
        <div className="skeleton mt-3 h-4 w-4/5 rounded-full" />
        <div className="skeleton mt-6 h-4 w-1/3 rounded-full" />
      </div>
    </div>
  )
}
