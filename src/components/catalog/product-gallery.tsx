import { ChevronLeft, ChevronRight, Expand } from 'lucide-react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { clamp, cn } from '@/lib/utils'
import { preloadGalleryImage, THUMB_IMAGE_SIZES } from './catalog-helpers'
import { GalleryImage, ZoomImage } from './image-zoom'
import { ProductImage } from './product-image'

const EASE = [0.16, 1, 0.3, 1] as const
const SWIPE_THRESHOLD = 40
/** ms sem rolar para considerar o carrossel parado (o índice é confirmado aí) */
const SETTLE_DELAY = 120

/**
 * Página do produto no celular (< sm): imagem de ponta a ponta com altura contida
 * (nome e preço aparecem cedo) — nunca mais alta que a proporção 5:6 natural.
 */
const PAGE_FRAME_MOBILE = 'max-sm:-mx-4 max-sm:aspect-auto max-sm:h-[min(46svh,120vw)] max-sm:w-auto max-sm:rounded-none max-sm:ring-0'
/** Tablet (sm–lg, coluna única): a imagem não ocupa a tela inteira — no máx. ~62% da altura, centralizada. */
const PAGE_FRAME_TABLET = 'sm:max-lg:mx-auto sm:max-lg:w-[min(100%,calc(62svh*5/6))]'

export interface ProductGalleryProps {
  images: string[]
  /** nome do produto (alt das imagens) */
  name: string
  /**
   * modal = miniaturas embaixo (no celular, em coluna ao lado da imagem);
   * page = miniaturas verticais à esquerda no desktop e pontos no celular
   */
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
 * Galeria de produto. Abaixo de md: carrossel nativo com scroll-snap (a imagem
 * acompanha o dedo). A partir de md: troca com fade, zoom no hover, setas e
 * teclado (← → Home End). Miniaturas quando há 2+ imagens.
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
  // telas de toque estreitas: carrossel com scroll-snap em vez do fade
  const trackMode = useMediaQuery('(max-width: 767px)')
  // posição visível durante o arrasto (o índice só é confirmado quando o carrossel para)
  const [liveIndex, setLiveIndex] = useState<number | null>(null)
  const shownIndex = trackMode && liveIndex !== null ? clamp(liveIndex, 0, Math.max(0, count - 1)) : index

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

  // swipe horizontal no toque (modo fade; o scroll vertical continua nativo: touch-action pan-y)
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
  // quick view no celular: miniaturas em coluna ao lado (a imagem fica mais baixa)
  const sideThumbs = variant === 'modal' && multiple

  const frame = (
    <div
      className={cn(
        'group/gallery relative aspect-[5/6] w-full overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-black/[0.04] select-none dark:ring-white/[0.06]',
        !trackMode && 'touch-pan-y',
        variant === 'page' && cn(PAGE_FRAME_MOBILE, PAGE_FRAME_TABLET),
        frameClassName,
      )}
      onPointerDown={trackMode ? undefined : handlePointerDown}
      onPointerUp={trackMode ? undefined : handlePointerUp}
      onPointerCancel={trackMode ? undefined : () => (swipe.current = null)}
    >
      {trackMode ? (
        <GalleryTrack
          images={images}
          name={name}
          sizes={sizes}
          priority={priority}
          index={index}
          onLiveIndex={setLiveIndex}
          onSettle={(settled) => {
            setLiveIndex(null)
            if (settled !== index) select(settled)
          }}
          onOpenViewer={onOpenViewer}
        />
      ) : (
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
      )}

      {onOpenViewer && (
        // alvo acessível por teclado para o visualizador (o clique na imagem faz o mesmo);
        // no desktop aparece no hover — em telas só de toque fica sempre visível
        <button
          type="button"
          onClick={() => onOpenViewer(index)}
          aria-label="Ver imagem em tela cheia"
          className="absolute right-3 bottom-3 z-10 inline-flex size-10 items-center justify-center rounded-full bg-white/80 text-ink-950 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition-[opacity,transform,background-color] duration-300 ease-out-expo hover:bg-white focus-visible:opacity-100 active:scale-95 md:[@media(hover:hover)]:opacity-0 md:group-hover/gallery:opacity-100 dark:bg-ink-950/70 dark:text-white dark:ring-white/10 dark:hover:bg-ink-950/90"
        >
          <Expand className="size-4" aria-hidden />
        </button>
      )}

      {multiple && (
        <>
          <GalleryArrow side="left" onClick={() => select(index - 1)} />
          <GalleryArrow side="right" onClick={() => select(index + 1)} />
          <span
            className={cn(
              'pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-ink-950 tabular-nums ring-1 ring-black/5 backdrop-blur-md dark:bg-ink-950/70 dark:text-white dark:ring-white/10',
              // página no celular: os pontos abaixo da imagem já indicam a posição
              variant === 'page' && 'max-sm:hidden',
            )}
            aria-hidden
          >
            {shownIndex + 1}/{count}
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
      className={cn(
        variant === 'page'
          ? 'flex flex-col gap-3 lg:flex-row-reverse lg:items-start lg:gap-4'
          : cn('flex flex-col gap-3', sideThumbs && 'max-sm:flex-row-reverse max-sm:items-start max-sm:justify-center max-sm:gap-2.5'),
        className,
      )}
    >
      <div className={cn('min-w-0 flex-1', sideThumbs && 'max-sm:flex-none')}>
        {frame}
        {multiple && variant === 'page' && (
          // indicador de posição do carrossel (celular); a navegação acessível fica nas setas
          <div className="mt-3 flex justify-center gap-1.5 sm:hidden" aria-hidden>
            {images.map((path, i) => (
              <span
                key={`${path}-${i}`}
                className={cn(
                  'h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out-expo',
                  i === shownIndex ? 'w-5 bg-fg' : 'w-1.5 bg-line-strong',
                )}
              />
            ))}
          </div>
        )}
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
            variant === 'page' &&
              'max-sm:hidden sm:max-lg:justify-center lg:max-h-[calc(100dvh-10rem)] lg:w-[5.25rem] lg:shrink-0 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto',
            variant === 'modal' &&
              'justify-center max-sm:max-h-[min(42dvh,24rem)] max-sm:w-14 max-sm:shrink-0 max-sm:flex-col max-sm:justify-start max-sm:overflow-x-hidden max-sm:overflow-y-auto',
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
                  variant === 'page' ? 'ring-offset-bg lg:w-full' : 'ring-offset-surface max-sm:w-full max-sm:rounded-lg',
                  i === shownIndex ? 'ring-fg' : 'opacity-60 ring-transparent hover:opacity-100',
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

interface GalleryTrackProps {
  images: string[]
  name: string
  sizes: string
  priority: boolean
  /** índice confirmado (setas, teclado, miniaturas, visualizador) */
  index: number
  /** posição visível enquanto o carrossel rola */
  onLiveIndex: (index: number) => void
  /** carrossel parou nesta imagem */
  onSettle: (index: number) => void
  onOpenViewer?: (index: number) => void
}

/**
 * Carrossel nativo (scroll-snap, uma imagem por gesto). O índice externo rola
 * até a imagem; a rolagem do usuário só confirma o índice quando para — assim
 * as duas fontes nunca brigam.
 */
function GalleryTrack({ images, name, sizes, priority, index, onLiveIndex, onSettle, onOpenViewer }: GalleryTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const settleTimer = useRef<number | undefined>(undefined)
  const positioned = useRef(false)
  const reduceMotion = useReducedMotion()
  const count = images.length

  // índice mudou por fora: rola até ele (na montagem, sem animação)
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    const target = index * track.clientWidth
    if (Math.abs(track.scrollLeft - target) >= 2) {
      track.scrollTo({ left: target, behavior: positioned.current && !reduceMotion ? 'smooth' : 'instant' })
    }
    positioned.current = true
  }, [index, reduceMotion])

  useEffect(() => () => window.clearTimeout(settleTimer.current), [])

  function handleScroll() {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    const position = clamp(Math.round(track.scrollLeft / track.clientWidth), 0, count - 1)
    onLiveIndex(position)
    window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => onSettle(position), SETTLE_DELAY)
  }

  return (
    <div
      ref={trackRef}
      onScroll={handleScroll}
      className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-none"
    >
      {images.map((path, i) => (
        <div
          key={`${path}-${i}`}
          className="relative h-full w-full shrink-0 snap-center snap-always"
          aria-hidden={i !== index || undefined}
          onClick={onOpenViewer ? () => onOpenViewer(i) : undefined}
        >
          <GalleryImage
            path={path}
            alt={count > 1 ? `${name} — imagem ${i + 1} de ${count}` : name}
            sizes={sizes}
            priority={priority && i === 0}
          />
        </div>
      ))}
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
        // só some onde existe hover de verdade (num iPad só com toque ficaria invisível)
        'focus-visible:opacity-100 md:[@media(hover:hover)]:opacity-0 md:group-hover/gallery:opacity-100',
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
        <div
          className={cn(
            'skeleton aspect-[5/6] w-full rounded-2xl',
            variant === 'page' && cn(PAGE_FRAME_MOBILE, PAGE_FRAME_TABLET),
            frameClassName,
          )}
        />
      </div>
      <div
        className={cn(
          'flex gap-2',
          variant === 'page' ? 'max-sm:hidden lg:w-[5.25rem] lg:flex-col' : 'justify-center max-sm:hidden',
        )}
      >
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={cn('skeleton aspect-[5/6] w-16 rounded-xl sm:w-[4.5rem]', variant === 'page' && 'lg:w-full')} />
        ))}
      </div>
    </div>
  )
}
