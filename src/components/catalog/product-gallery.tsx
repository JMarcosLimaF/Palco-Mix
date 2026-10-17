import { ChevronLeft, ChevronRight, Expand } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from '@/lib/utils'
import { preloadGalleryImage, THUMB_IMAGE_SIZES } from './catalog-helpers'
import { ZoomImage } from './image-zoom'
import { ProductImage } from './product-image'

const EASE = [0.16, 1, 0.3, 1] as const
const SWIPE_THRESHOLD = 40

export interface ProductGalleryProps {
  images: string[]
  /** nome do produto (alt das imagens) */
  name: string
  /** modal = miniaturas embaixo; page = miniaturas verticais à esquerda no desktop */
  variant?: 'modal' | 'page'
  /** `sizes` da imagem principal */
  sizes: string
  priority?: boolean
  /** índice controlado (opcional) */
  index?: number
  onIndexChange?: (index: number) => void
  /** clique na imagem principal (ex.: abrir o visualizador em tela cheia) */
  onOpenViewer?: (index: number) => void
  className?: string
  frameClassName?: string
}

/**
 * Galeria de produto: imagem principal com zoom no hover (desktop), setas,
 * teclado (← → Home End), swipe no toque e miniaturas quando há 2+ imagens.
 */
export function ProductGallery({
  images,
  name,
  variant = 'modal',
  sizes,
  priority = false,
  index: controlledIndex,
  onIndexChange,
  onOpenViewer,
  className,
  frameClassName,
}: ProductGalleryProps) {
  const [innerIndex, setInnerIndex] = useState(0)
  const count = images.length
  const index = Math.min(controlledIndex ?? innerIndex, Math.max(0, count - 1))
  const multiple = count > 1

  const select = useCallback(
    (next: number) => {
      if (count === 0) return
      const wrapped = (next + count) % count
      setInnerIndex(wrapped)
      onIndexChange?.(wrapped)
    },
    [count, onIndexChange],
  )

  // pré-carrega as vizinhas para a troca ser instantânea
  useEffect(() => {
    if (count < 2) return
    preloadGalleryImage(images[(index + 1) % count], sizes)
    preloadGalleryImage(images[(index - 1 + count) % count], sizes)
  }, [images, index, count, sizes])

  // swipe horizontal no toque (o scroll vertical continua nativo: touch-action pan-y)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse') return
    swipe.current = { x: event.clientX, y: event.clientY }
    swiped.current = false
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = swipe.current
    swipe.current = null
    if (!start || !multiple) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.2) {
      swiped.current = true
      select(index + (dx < 0 ? 1 : -1))
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!multiple) return
    const target = event.target as HTMLElement
    if (target.closest('input, textarea, select')) return
    let next: number | null = null
    if (event.key === 'ArrowRight') next = index + 1
    else if (event.key === 'ArrowLeft') next = index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = count - 1
    if (next === null) return
    event.preventDefault()
    select(next)
  }

  const current = images[index]
  const label = multiple ? `Imagem ${index + 1} de ${count}` : 'Imagem do produto'

  const frame = (
    <div
      className={cn(
        'group/gallery relative aspect-[5/6] w-full touch-pan-y overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-black/[0.04] select-none dark:ring-white/[0.06]',
        frameClassName,
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => (swipe.current = null)}
    >
      <AnimatePresence initial={false}>
        <m.div
          key={`${index}:${current ?? ''}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.35, ease: EASE } }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
        >
          <ZoomImage
            path={current}
            alt={multiple ? `${name} — imagem ${index + 1} de ${count}` : name}
            sizes={sizes}
            priority={priority && index === 0}
            mode="hover"
            onClick={
              onOpenViewer
                ? () => {
                    if (swiped.current) {
                      swiped.current = false
                      return
                    }
                    onOpenViewer(index)
                  }
                : undefined
            }
          />
        </m.div>
      </AnimatePresence>

      {onOpenViewer && (
        // alvo acessível por teclado para o visualizador (o clique na imagem faz o mesmo)
        <button
          type="button"
          onClick={() => onOpenViewer(index)}
          aria-label="Ver imagem em tela cheia"
          className="absolute right-3 bottom-3 z-10 inline-flex size-10 items-center justify-center rounded-full bg-white/80 text-ink-950 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-[opacity,transform,background-color] duration-300 ease-out-expo hover:bg-white focus-visible:opacity-100 active:scale-95 md:opacity-0 md:group-hover/gallery:opacity-100 dark:bg-ink-950/70 dark:text-white dark:ring-white/10 dark:hover:bg-ink-950/90"
        >
          <Expand className="size-4" aria-hidden />
        </button>
      )}

      {multiple && (
        <>
          <GalleryArrow side="left" onClick={() => select(index - 1)} />
          <GalleryArrow side="right" onClick={() => select(index + 1)} />
          <span
            className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-white/80 px-2.5 py-1 text-[0.6875rem] font-bold text-ink-950 tabular-nums ring-1 ring-black/5 backdrop-blur-md dark:bg-ink-950/70 dark:text-white dark:ring-white/10"
            aria-hidden
          >
            {index + 1}/{count}
          </span>
        </>
      )}
    </div>
  )

  return (
    <div
      role="group"
      aria-roledescription="galeria"
      aria-label={`Imagens de ${name}`}
      onKeyDown={handleKeyDown}
      className={cn(variant === 'page' ? 'flex flex-col gap-3 lg:flex-row-reverse lg:items-start lg:gap-4' : 'flex flex-col gap-3', className)}
    >
      <div className="min-w-0 flex-1">
        {frame}
        <p className="sr-only" aria-live="polite">
          {label}
        </p>
      </div>

      {multiple && (
        <ul
          aria-label="Miniaturas"
          className={cn(
            'flex gap-2 overflow-x-auto scrollbar-none',
            // folga para o anel de foco/ativo não ser cortado pelo overflow
            '-m-1 p-1',
            variant === 'page' && 'lg:max-h-[calc(100dvh-10rem)] lg:w-[5.25rem] lg:shrink-0 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto',
            variant === 'modal' && 'justify-center',
          )}
        >
          {images.map((path, i) => (
            <li key={`${path}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => select(i)}
                aria-label={`Ver imagem ${i + 1} de ${count}`}
                aria-current={i === index ? 'true' : undefined}
                className={cn(
                  'relative block aspect-[5/6] w-16 overflow-hidden rounded-xl bg-surface-2 ring-2 ring-offset-2 transition-[box-shadow,opacity,transform] duration-300 ease-out-expo active:scale-95 sm:w-[4.5rem]',
                  variant === 'page' ? 'ring-offset-bg lg:w-full' : 'ring-offset-surface',
                  i === index ? 'ring-fg' : 'opacity-60 ring-transparent hover:opacity-100',
                )}
              >
                <ProductImage path={path} alt="" sizes={THUMB_IMAGE_SIZES} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function GalleryArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Imagem anterior' : 'Próxima imagem'}
      className={cn(
        'absolute top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink-950 shadow-sm ring-1 ring-black/5 backdrop-blur-md',
        'transition-[opacity,transform,background-color] duration-300 ease-out-expo hover:bg-white active:scale-95',
        'focus-visible:opacity-100 md:opacity-0 md:group-hover/gallery:opacity-100',
        'dark:bg-ink-950/70 dark:text-white dark:ring-white/10 dark:hover:bg-ink-950/90',
        side === 'left' ? 'left-3' : 'right-3',
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  )
}

/** Esqueleto da galeria. */
export function ProductGallerySkeleton({
  variant = 'modal',
  className,
  frameClassName,
}: {
  variant?: 'modal' | 'page'
  className?: string
  frameClassName?: string
}) {
  return (
    <div
      className={cn(variant === 'page' ? 'flex flex-col gap-3 lg:flex-row-reverse lg:gap-4' : 'flex flex-col gap-3', className)}
      aria-hidden
    >
      <div className="min-w-0 flex-1">
        <div className={cn('skeleton aspect-[5/6] w-full rounded-2xl', frameClassName)} />
      </div>
      <div className={cn('flex gap-2', variant === 'page' ? 'lg:w-[5.25rem] lg:flex-col' : 'justify-center')}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={cn('skeleton aspect-[5/6] w-16 rounded-xl sm:w-[4.5rem]', variant === 'page' && 'lg:w-full')} />
        ))}
      </div>
    </div>
  )
}
