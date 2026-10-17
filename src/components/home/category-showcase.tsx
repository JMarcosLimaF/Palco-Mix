/**
 * "Compre por categoria" — grade bento que sempre completa as linhas.
 * Cada peça: a capa da categoria flutuando como um pôster sobre a própria
 * arte desfocada, nome em destaque, contagem e seta.
 */
import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { ProductImage } from '@/components/catalog/product-image'
import { useCategories } from '@/hooks/catalog'
import { catalogHref } from '@/lib/catalog-params'
import { cn, pluralize } from '@/lib/utils'
import type { Category } from '@/types/catalog'
import { nameCollator, useActiveCatalogIndex } from './catalog-index'
import { bentoLayout } from './category-layout'
import { Reveal } from './reveal'
import { SectionHeader } from './section-header'

const MAX_TILES = 8
const POSTER_SIZES = '(min-width: 1024px) 220px, (min-width: 768px) 30vw, 42vw'
const ROWS = 'auto-rows-[14rem] sm:auto-rows-[16rem] lg:auto-rows-[18rem]'

export interface CategoryTileProps {
  category: Category
  count: number
  cover: string | undefined
}

export function CategoryTile({ category, count, cover }: CategoryTileProps) {
  return (
    <Link
      to={catalogHref({ categories: [category.id] })}
      className="group relative isolate flex h-full flex-col overflow-hidden rounded-3xl bg-ink-900 text-white ring-1 ring-black/5 transition-shadow duration-500 ease-out-expo hover:shadow-card-hover focus-visible:outline-offset-4 dark:ring-white/[0.06]"
    >
      {/* fundo: a própria capa desfocada + véu para legibilidade */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <ProductImage
          path={cover}
          alt=""
          fit="cover"
          sizes={POSTER_SIZES}
          className="scale-[1.35] transform-gpu opacity-80 blur-2xl saturate-150"
        />
        <div className="absolute inset-0 bg-linear-to-t from-ink-950/90 via-ink-950/30 to-ink-950/5" />
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pt-4">
        <div className="relative aspect-[5/6] h-full max-w-full overflow-hidden rounded-xl shadow-[0_24px_48px_-16px_rgb(0_0_0/0.65)] ring-1 ring-white/15 transition-[scale,rotate] duration-700 ease-out-expo group-hover:scale-[1.05] group-hover:-rotate-2">
          <ProductImage path={cover} alt="" sizes={POSTER_SIZES} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="title-display truncate text-xl sm:text-2xl lg:text-[1.75rem]">{category.name}</h3>
          <p className="mt-1 text-xs font-medium text-white/70 tabular-nums">{pluralize(count, 'produto', 'produtos')}</p>
        </div>
        <span
          aria-hidden
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-ink-950 transition-[background-color,color,rotate] duration-300 ease-out-expo group-hover:-rotate-45 group-hover:bg-brand-500 group-hover:text-white"
        >
          <ArrowRight className="size-[1.1rem]" />
        </span>
      </div>
    </Link>
  )
}

export function CategoryShowcase() {
  const categories = useCategories()
  const catalog = useActiveCatalogIndex()
  const loading = categories.isPending || catalog.isLoading

  // só categorias com produtos ativos, as maiores primeiro (ganham as peças largas)
  const tiles = useMemo(
    () =>
      (categories.data ?? [])
        .map((category) => {
          const products = catalog.byCategory.get(category.id) ?? []
          return { category, count: products.length, cover: category.image ?? products[0]?.images[0] }
        })
        .filter((tile) => tile.count > 0)
        .sort((a, b) => b.count - a.count || nameCollator.compare(a.category.name, b.category.name))
        .slice(0, MAX_TILES),
    [categories.data, catalog.byCategory],
  )

  if (!loading && tiles.length === 0) return null

  const layout = bentoLayout(loading ? 4 : tiles.length)

  return (
    <section aria-labelledby="home-categorias" className="container-page pt-16 sm:pt-24">
      <Reveal>
        <SectionHeader
          id="home-categorias"
          eyebrow="Categorias"
          title="Compre por categoria"
          description="Escolha uma seção e veja tudo o que tem nela."
          action={{ to: '/categorias', label: 'Ver todas', ariaLabel: 'Ver todas as categorias' }}
        />
      </Reveal>

      <ul
        aria-busy={loading || undefined}
        className={cn('mt-8 grid grid-flow-row-dense gap-3 sm:mt-10 sm:gap-4', ROWS, layout.grid)}
      >
        {loading
          ? layout.spans.map((span, i) => (
              <li key={i} className={span}>
                <div aria-hidden className="skeleton size-full rounded-3xl" />
              </li>
            ))
          : tiles.map((tile, i) => (
              <li key={tile.category.id} className={layout.spans[i]}>
                <Reveal className="h-full" delay={Math.min(i, 5) * 0.05}>
                  <CategoryTile category={tile.category} count={tile.count} cover={tile.cover} />
                </Reveal>
              </li>
            ))}
      </ul>
    </section>
  )
}
