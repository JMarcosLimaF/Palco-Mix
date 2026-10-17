/**
 * Trilho horizontal de produtos: scroll-snap, bordas com fade só do lado
 * que ainda tem conteúdo, setas (desktop) que rolam uma "página" por vez.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { ProductCard, ProductCardSkeleton } from '@/components/catalog/product-card'
import { useCatalogLookups } from '@/hooks/catalog'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/catalog'

/** Largura real de cada card em cada breakpoint (ver ITEM_CLASS). */
const RAIL_IMAGE_SIZES = '(min-width: 1024px) 18vw, (min-width: 768px) 23vw, (min-width: 640px) 30vw, 42vw'

// celular: ~45% da largura útil — 2 cards inteiros e o 3º aparecendo na borda
const ITEM_CLASS = 'w-[45%] shrink-0 snap-start sm:w-[30%] md:w-[23%] lg:w-[calc((100%-4*1.25rem)/5)]'

// na borda a seta fica aria-disabled (não `disabled`): continua focável, então o foco do
// teclado não se perde quando o trilho chega ao fim; com foco ela segue visível (esmaecida)
const ARROW_CLASS =
  'absolute top-[38%] z-10 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-elevated/90 text-fg ' +
  'shadow-card-hover ring-1 ring-line backdrop-blur-md transition-[opacity,scale,background-color] duration-300 ease-out-expo ' +
  'hover:bg-elevated hover:scale-105 active:scale-95 md:flex ' +
  'aria-disabled:pointer-events-none aria-disabled:scale-90 aria-disabled:opacity-0 aria-disabled:focus-visible:opacity-50'

export interface ProductRailProps {
  products: readonly Product[] | undefined
  loading?: boolean
  /** rótulo acessível da lista */
  label: string
  skeletonCount?: number
  className?: string
}

export function ProductRail({ products, loading = false, label, skeletonCount = 5, className }: ProductRailProps) {
  const { distributorName, categoryName } = useCatalogLookups()
  const reduceMotion = useReducedMotion()
  const scrollerRef = useRef<HTMLUListElement>(null)
  const listId = useId()
  const [edges, setEdges] = useState({ atStart: true, atEnd: true })
  const itemCount = products?.length ?? 0

  // acompanha se há conteúdo antes/depois (só re-renderiza quando o estado muda)
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    let frame = 0
    const measure = () => {
      frame = 0
      const max = scroller.scrollWidth - scroller.clientWidth
      const atStart = scroller.scrollLeft <= 2
      const atEnd = scroller.scrollLeft >= max - 2
      setEdges((prev) => (prev.atStart === atStart && prev.atEnd === atEnd ? prev : { atStart, atEnd }))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    schedule()
    scroller.addEventListener('scroll', schedule, { passive: true })
    const observer = new ResizeObserver(schedule)
    observer.observe(scroller)
    return () => {
      cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', schedule)
      observer.disconnect()
    }
  }, [itemCount, loading])

  function scrollByPage(direction: 1 | -1) {
    const scroller = scrollerRef.current
    if (!scroller || (direction === 1 ? edges.atEnd : edges.atStart)) return
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.85, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <div className={cn('relative', className)}>
      <ul
        id={listId}
        ref={scrollerRef}
        aria-label={label}
        aria-busy={loading || undefined}
        className={cn(
          'scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pt-2 pb-4',
          '-mx-4 scroll-px-4 px-4 sm:-mx-6 sm:scroll-px-6 sm:gap-4 sm:px-6 lg:-mx-2 lg:scroll-px-2 lg:gap-5 lg:px-2',
          '[mask-image:linear-gradient(to_right,transparent,#000_var(--rail-fade-start),#000_calc(100%-var(--rail-fade-end)),transparent)]',
          edges.atStart ? '[--rail-fade-start:0px]' : '[--rail-fade-start:3rem]',
          edges.atEnd ? '[--rail-fade-end:0px]' : '[--rail-fade-end:3rem]',
        )}
      >
        {loading
          ? Array.from({ length: skeletonCount }, (_, i) => (
              <li key={i} className={ITEM_CLASS}>
                <ProductCardSkeleton />
              </li>
            ))
          : products?.map((product) => (
              <li key={product.id} className={ITEM_CLASS}>
                <ProductCard
                  product={product}
                  distributorName={distributorName(product.distributor)}
                  categoryName={categoryName(product.category)}
                  sizes={RAIL_IMAGE_SIZES}
                />
              </li>
            ))}
      </ul>

      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        aria-disabled={edges.atStart}
        aria-label="Ver produtos anteriores"
        aria-controls={listId}
        className={cn(ARROW_CLASS, '-left-3 lg:-left-5')}
      >
        <ChevronLeft aria-hidden className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollByPage(1)}
        aria-disabled={edges.atEnd}
        aria-label="Ver mais produtos"
        aria-controls={listId}
        className={cn(ARROW_CLASS, '-right-3 lg:-right-5')}
      >
        <ChevronRight aria-hidden className="size-5" />
      </button>
    </div>
  )
}
