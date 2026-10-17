/**
 * "Compre por categoria" — no celular, carrossel horizontal com snap (o próximo
 * cartão aparece cortado); a partir de sm, grade bento que sempre completa as linhas.
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
import { Reveal, RevealItem, RevealList } from './reveal'
import { SectionHeader } from './section-header'

const MAX_TILES = 8
const POSTER_SIZES = '(min-width: 1024px) 220px, (min-width: 768px) 30vw, (min-width: 640px) 42vw, 32vw'
/**
 * celular: trilho com rolagem horizontal (py-2 dá espaço ao anel de foco, que a rolagem cortaria);
 * sm+: grade bento (as classes de colunas vêm do bentoLayout)
 */
const LIST_CLASS =
  'scrollbar-none -mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 py-2 ' +
  'sm:mx-0 sm:mt-10 sm:grid sm:grid-flow-row-dense sm:auto-rows-[16rem] sm:gap-4 sm:overflow-visible sm:p-0 lg:auto-rows-[18rem]'
/** celular: ~42% da largura (2 cartões e o 3º cortado); sm+: a altura vem da linha da grade */
const ITEM_CLASS = 'h-52 w-[42%] shrink-0 snap-start sm:h-auto sm:w-auto'

export interface CategoryTileProps {
  category: Category
  count: number
  cover: string | undefined
}

export function CategoryTile({ category, count, cover }: CategoryTileProps) {
  return (
    <Link
      to={catalogHref({ categories: [category.id] })}
      className="group relative isolate flex h-full flex-col overflow-hidden rounded-2xl bg-ink-900 text-white ring-1 ring-black/5 transition-shadow duration-500 ease-out-expo hover:shadow-card-hover focus-visible:outline-offset-4 sm:rounded-3xl dark:ring-white/[0.06]"
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

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="relative aspect-[5/6] h-full max-w-full overflow-hidden rounded-xl shadow-[0_24px_48px_-16px_rgb(0_0_0/0.65)] ring-1 ring-white/15 transition-[scale,rotate] duration-700 ease-out-expo group-hover:scale-[1.05] group-hover:-rotate-2">
          <ProductImage path={cover} alt="" sizes={POSTER_SIZES} />
        </div>
      </div>

      {/* no celular (peças de ~160px) a seta sai e o nome pode quebrar linha: nada de "Rasteir…" */}
      <div className="flex items-end justify-between gap-3 p-3 sm:p-5">
        <div className="min-w-0">
          <h3 className="title-display line-clamp-2 text-[1.0625rem] break-words sm:text-2xl lg:text-[1.75rem]">
            {category.name}
          </h3>
          <p className="mt-1 text-xs font-medium text-white/70 tabular-nums">{pluralize(count, 'produto', 'produtos')}</p>
        </div>
        <span
          aria-hidden
          className="hidden size-10 shrink-0 items-center justify-center rounded-full bg-white text-ink-950 transition-[background-color,color,rotate] duration-300 ease-out-expo group-hover:-rotate-45 group-hover:bg-brand-500 group-hover:text-white sm:inline-flex"
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
    <section aria-labelledby="home-categorias" className="container-page pt-10 sm:pt-24">
      <Reveal>
        <SectionHeader
          id="home-categorias"
          eyebrow="Categorias"
          title="Compre por categoria"
          description="Escolha uma seção e veja tudo o que tem nela."
          action={{ to: '/categorias', label: 'Ver todas', ariaLabel: 'Ver todas as categorias' }}
        />
      </Reveal>

      {loading ? (
        <ul aria-busy className={cn(LIST_CLASS, layout.grid)}>
          {layout.spans.map((span, i) => (
            <li key={i} className={cn(ITEM_CLASS, span)}>
              <div aria-hidden className="skeleton size-full rounded-2xl sm:rounded-3xl" />
            </li>
          ))}
        </ul>
      ) : (
        // a lista comanda a entrada escalonada: os cartões fora da tela (no trilho) entram junto
        <RevealList className={cn(LIST_CLASS, layout.grid)}>
          {tiles.map((tile, i) => (
            <RevealItem key={tile.category.id} className={cn(ITEM_CLASS, layout.spans[i])}>
              <CategoryTile category={tile.category} count={tile.count} cover={tile.cover} />
            </RevealItem>
          ))}
        </RevealList>
      )}
    </section>
  )
}
