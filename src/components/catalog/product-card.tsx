import { Eye } from 'lucide-react'
import { memo, useState, type MouseEvent } from 'react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { useOpenQuickView } from '@/hooks/use-quick-view'
import { cn, discountPercent, isNewProduct } from '@/lib/utils'
import type { Product } from '@/types/catalog'
import { Price } from './price'
import { ProductImage } from './product-image'

/** Desconto mínimo (%) para exibir o selo no card. */
const MIN_DISCOUNT_BADGE = 10

export interface ProductCardProps {
  product: Product
  /** nome da marca/distribuidor já resolvido */
  distributorName?: string
  /** nome da categoria já resolvido */
  categoryName?: string
  /** primeiro(s) card(s) acima da dobra */
  priority?: boolean
  /** atributo sizes da imagem conforme a grade */
  sizes?: string
  className?: string
}

/**
 * Card de produto da vitrine.
 * Clique → Visualização Rápida (modal). Ctrl/Cmd/clique do meio → página do produto.
 * Hover: zoom suave, ou troca para a 2ª imagem quando houver.
 */
export const ProductCard = memo(function ProductCard({
  product,
  distributorName,
  categoryName,
  priority = false,
  sizes,
  className,
}: ProductCardProps) {
  const open = useOpenQuickView()
  const isNew = isNewProduct(product)
  const off = discountPercent(product)
  // diferenças pequenas (à vista × a prazo) aparecem só no preço riscado
  const showOff = off >= MIN_DISCOUNT_BADGE
  const secondImage = product.images[1]
  // a 2ª imagem só é baixada quando o usuário passa o mouse pela primeira vez
  const [wantSecond, setWantSecond] = useState(false)

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    open(product.id)
  }

  return (
    <article
      className={cn('group/card cv-auto relative', className)}
      onPointerEnter={secondImage && !wantSecond ? () => setWantSecond(true) : undefined}
    >
      <Link
        to={`/produto/${product.id}`}
        onClick={handleClick}
        className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
        aria-label={`${product.name}${distributorName ? ` — ${distributorName}` : ''}. Abrir visualização rápida`}
      >
        <div className="relative aspect-[5/6] overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-black/[0.04] transition-shadow duration-500 ease-out-expo group-hover/card:shadow-card-hover dark:ring-white/[0.06]">
          <ProductImage
            path={product.images[0]}
            alt={product.name}
            priority={priority}
            sizes={sizes}
            className={cn(
              'transition-[transform,opacity] duration-700 ease-out-expo will-change-transform',
              !secondImage && 'group-hover/card:scale-[1.06]',
            )}
          />
          {secondImage && wantSecond && (
            // a 2ª imagem cobre a 1ª só depois de carregada (ProductImage faz o fade-in)
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-500 ease-out-expo group-hover/card:opacity-100"
              aria-hidden
            >
              <ProductImage path={secondImage} alt="" sizes={sizes} />
            </div>
          )}

          <div className="pointer-events-none absolute top-2.5 right-2.5 left-2.5 flex flex-wrap items-start gap-1.5">
            {isNew && <Badge tone="brand">Novo</Badge>}
            {/* no celular o card é estreito: o selo "Destaque" fica só a partir de sm */}
            {product.isFeatured && (
              <Badge tone="dark" className="hidden sm:inline-flex">
                Destaque
              </Badge>
            )}
            {showOff && <Badge tone="light">-{off}%</Badge>}
          </div>

          {/* faixa de ação no hover (desktop) */}
          <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 hidden translate-y-3 opacity-0 transition-all duration-300 ease-out-expo group-hover/card:translate-y-0 group-hover/card:opacity-100 md:block">
            <span className="flex h-10 items-center justify-center gap-2 rounded-full bg-white/90 text-xs font-bold text-ink-950 shadow-lg backdrop-blur-md dark:bg-ink-950/85 dark:text-white">
              <Eye className="size-4" aria-hidden />
              Visualização rápida
            </span>
          </div>
        </div>

        <div className="px-0.5 pt-3">
          <p className="eyebrow truncate text-brand-600 dark:text-brand-400">
            {distributorName}
            {distributorName && categoryName && <span className="text-subtle"> · {categoryName}</span>}
          </p>
          <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm leading-5 font-semibold text-fg transition-colors group-hover/card:text-brand-600 dark:group-hover/card:text-brand-400">
            {product.name}
          </h3>
          <Price product={product} size="sm" className="mt-1.5" />
        </div>
      </Link>
    </article>
  )
})

/** Esqueleto com as mesmas dimensões do card. */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="skeleton aspect-[5/6] rounded-2xl" />
      <div className="skeleton mt-3 h-3 w-1/3 rounded-full" />
      <div className="skeleton mt-2 h-4 w-4/5 rounded-full" />
      <div className="skeleton mt-2 h-4 w-1/4 rounded-full" />
    </div>
  )
}
