import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { useCatalogLookups, useRelatedProducts } from '@/hooks/catalog'
import { catalogHref } from '@/lib/catalog-params'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/catalog'
import { RAIL_IMAGE_SIZES } from './catalog-helpers'
import { ProductCard, ProductCardSkeleton } from './product-card'

// pt-2/pb-2: folga para o anel de foco do card dentro do overflow do trilho
const RAIL =
  '-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pt-2 pb-2 scrollbar-none ' +
  'sm:-mx-6 sm:scroll-px-6 sm:gap-5 sm:px-6 ' +
  'lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-y-10 lg:overflow-visible lg:px-0 lg:pt-0 lg:pb-0'
const RAIL_ITEM = 'w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-auto'

/** "Você também pode gostar": rail com scroll-snap no mobile, grade de 4 colunas no desktop. */
export function RelatedProducts({ product, className }: { product: Product; className?: string }) {
  const { data, isLoading } = useRelatedProducts(product, 8)
  const { categoryById, distributorById } = useCatalogLookups()
  const items = data ?? []

  if (!isLoading && items.length === 0) return null

  const categoryName = categoryById.get(product.category)?.name

  return (
    <section aria-labelledby="related-title" className={cn('border-t border-line pt-10 sm:pt-16', className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-brand-600 dark:text-brand-400">Combina com você</p>
          <h2 id="related-title" className="title-display mt-2 text-[1.75rem] sm:text-4xl">
            Você também pode gostar
          </h2>
        </div>
        {categoryName && (
          <Link
            to={catalogHref({ categories: [product.category] })}
            className="group hidden shrink-0 items-center gap-1.5 rounded-full text-sm font-semibold text-fg transition-colors hover:text-brand-600 sm:inline-flex dark:hover:text-brand-400"
          >
            Ver mais {categoryName.toLocaleLowerCase('pt-BR')}
            <ArrowRight className="size-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" aria-hidden />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className={cn(RAIL, 'mt-5 sm:mt-6 lg:mt-8')} aria-hidden>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={RAIL_ITEM}>
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <ul role="list" className={cn(RAIL, 'mt-5 sm:mt-6 lg:mt-8')}>
          {items.map((item) => (
            <li key={item.id} className={RAIL_ITEM}>
              <ProductCard
                product={item}
                distributorName={distributorById.get(item.distributor)?.name}
                categoryName={categoryById.get(item.category)?.name}
                sizes={RAIL_IMAGE_SIZES}
              />
            </li>
          ))}
        </ul>
      )}

      {categoryName && (
        <Link
          to={catalogHref({ categories: [product.category] })}
          className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-full border border-line-strong px-5 text-sm font-semibold text-fg transition-[background-color,transform] duration-200 ease-out-expo active:scale-[0.97] active:bg-surface-2 sm:hidden"
        >
          Ver mais {categoryName.toLocaleLowerCase('pt-BR')}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </section>
  )
}
