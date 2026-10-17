import { memo, useState, type ReactNode } from 'react'
import { useCatalogLookups } from '@/hooks/catalog'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/catalog'
import { GRID_IMAGE_SIZES } from './catalog-helpers'
import { ProductCard, ProductCardSkeleton } from './product-card'

const GRID_CLASS = 'grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 xl:grid-cols-4'

export interface ProductGridProps {
  items: Product[]
  /** resultado anterior exibido enquanto o novo carrega */
  pending?: boolean
  /** muda a cada troca de filtro/página — habilita a entrada animada dos cards novos */
  resultKey: string
  className?: string
}

/**
 * Grade da vitrine. Cards que permanecem entre duas consultas não remontam
 * (chave = id); só os novos entram com fade/translate e stagger curtíssimo,
 * e só depois da primeira carga — nunca bloqueia a interação.
 */
export const ProductGrid = memo(function ProductGrid({ items, pending = false, resultKey, className }: ProductGridProps) {
  const { categoryById, distributorById } = useCatalogLookups()
  const [initialKey] = useState(resultKey)
  const animate = resultKey !== initialKey

  return (
    <ul
      role="list"
      aria-busy={pending || undefined}
      className={cn(
        GRID_CLASS,
        'transition-opacity duration-300 ease-out-expo',
        pending && 'opacity-60',
        className,
      )}
    >
      {items.map((product, index) => (
        <GridItem key={product.id} index={index} animate={animate}>
          <ProductCard
            product={product}
            distributorName={distributorById.get(product.distributor)?.name}
            categoryName={categoryById.get(product.category)?.name}
            priority={index < 4}
            sizes={GRID_IMAGE_SIZES}
          />
        </GridItem>
      ))}
    </ul>
  )
})

function GridItem({ index, animate, children }: { index: number; animate: boolean; children: ReactNode }) {
  // decidido na montagem: cards já visíveis não reanimam quando a lista muda
  const [entrance] = useState(() => (animate ? { animationDelay: `${Math.min(index, 11) * 28}ms` } : null))
  return (
    // cv-auto recorta a pintura na borda: o padding (compensado pela margem
    // negativa) dá folga ao anel de foco e à sombra do hover do card
    <li className={cn('cv-auto -m-2 p-2', entrance && 'animate-fade-in')} style={entrance ?? undefined}>
      {children}
    </li>
  )
}

/** Esqueleto da grade (carregamento inicial). */
export function ProductGridSkeleton({ count = 12, className }: { count?: number; className?: string }) {
  return (
    <div className={cn(GRID_CLASS, className)} role="status" aria-label="Carregando produtos">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
