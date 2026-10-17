import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { ProductCard, ProductCardSkeleton } from '@/components/catalog/product-card'
import { buttonVariants } from '@/components/ui/button-variants'
import { useCatalogLookups, useProductQuery } from '@/hooks/catalog'
import { catalogHref } from '@/lib/catalog-params'
import { cn } from '@/lib/utils'
import type { ProductQuery } from '@/types/catalog'
import { Reveal } from './reveal'
import { SectionHeader } from './section-header'

const LATEST_QUERY: ProductQuery = { sort: 'recent', pageSize: 8 }
const GRID_SIZES = '(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 46vw'

/** "Lançamentos": os 8 produtos mais recentes em grade 2/3/4 colunas. */
export function LatestProducts() {
  const query = useProductQuery(LATEST_QUERY)
  const { distributorName, categoryName } = useCatalogLookups()
  const items = query.data?.items ?? []
  const loading = query.isPending

  if (!loading && items.length === 0) return null

  return (
    <section aria-labelledby="home-lancamentos" className="container-page pt-10 sm:pt-24">
      <Reveal>
        <SectionHeader
          id="home-lancamentos"
          eyebrow="Lançamentos"
          title="Novidades no catálogo"
          description="Os produtos adicionados mais recentemente ao catálogo."
        />
      </Reveal>

      <ul
        aria-busy={loading || undefined}
        className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 sm:mt-10 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4"
      >
        {loading
          ? Array.from({ length: 8 }, (_, i) => (
              <li key={i} className={cn(i >= 6 && 'md:max-lg:hidden')}>
                <ProductCardSkeleton />
              </li>
            ))
          : items.map((product, i) => (
              // em 3 colunas, 6 itens fecham 2 linhas completas
              <li key={product.id} className={cn(i >= 6 && 'md:max-lg:hidden')}>
                <Reveal delay={(i % 4) * 0.06}>
                  <ProductCard
                    product={product}
                    distributorName={distributorName(product.distributor)}
                    categoryName={categoryName(product.category)}
                    sizes={GRID_SIZES}
                  />
                </Reveal>
              </li>
            ))}
      </ul>

      <div className="mt-7 flex justify-center sm:mt-12">
        <Link
          to={catalogHref({ sort: 'recent' })}
          className={buttonVariants({ variant: 'outline', size: 'lg', className: 'group/more w-full sm:w-auto' })}
        >
          Ver todos os lançamentos
          <ArrowRight
            aria-hidden
            className="transition-transform duration-300 ease-out-expo group-hover/more:translate-x-0.5"
          />
        </Link>
      </div>
    </section>
  )
}
