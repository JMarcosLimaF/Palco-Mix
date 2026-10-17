import * as Dialog from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from '@/lib/utils'
import { THUMB_IMAGE_SIZES } from './catalog-helpers'
import { ZoomImage } from './image-zoom'
import { ProductImage } from './product-image'

const EASE = [0.16, 1, 0.3, 1] as const
const VIEWER_SIZES = '100vw'

/** Pré-carrega o arquivo original (alta resolução). */
function preloadOriginal(path: string | undefined) {
  if (!path || path.startsWith('data:')) return
  const img = new Image()
  img.decoding = 'async'
  img.src = path
}

export interface ImageLightboxProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: string[]
  /** nome do produto (título acessível e alt) */
  name: string
  index: number
  onIndexChange: (index: number) => void
}

/**
 * Visualizador em tela cheia: imagem original em alta resolução, navegação por
 * setas/teclado/swipe, miniaturas e zoom 2x no clique ou toque (no toque,
 * ampliada, o arrasto move a imagem).
 * Radix Dialog cuida de foco preso, Esc e bloqueio de rolagem.
 */
export function ImageLightbox({ open, onOpenChange, images, name, index, onIndexChange }: ImageLightboxProps) {
  const count = images.length
  const multiple = count > 1
  const current = images[Math.min(index, Math.max(0, count - 1))]

  const go = (delta: number) => {
    if (!multiple) return
    onIndexChange((index + delta + count) % count)
  }

  // imagem ampliada (por índice: trocar de imagem volta ao normal); zera ao fechar
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) setZoomedIndex(null)
  }
  // trocar de imagem (miniatura, teclado, swipe) sempre volta ao tamanho normal
  const [prevIndex, setPrevIndex] = useState(index)
  if (index !== prevIndex) {
    setPrevIndex(index)
    setZoomedIndex(null)
  }
  const zoomed = zoomedIndex === index

  // pré-carrega os originais vizinhos enquanto o visualizador está aberto
  useEffect(() => {
    if (!open || count < 2) return
    preloadOriginal(images[(index + 1) % count])
    preloadOriginal(images[(index - 1 + count) % count])
  }, [open, images, index, count])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!multiple) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      go(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      onIndexChange(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      onIndexChange(count - 1)
    }
  }

  const swipe = useRef<{ x: number; y: number } | null>(null)

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    swipe.current = event.pointerType === 'mouse' ? null : { x: event.clientX, y: event.clientY }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = swipe.current
    swipe.current = null
    if (!start) return
    // ampliada (zoom do visualizador ou pinça do navegador): arrastar só move a imagem
    if (zoomed || (window.visualViewport?.scale ?? 1) > 1.01) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) go(dx < 0 ? 1 : -1)
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) onOpenChange(false) // arrastar para baixo fecha
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div
                className="fixed inset-0 z-[60] bg-ink-950/95 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount onKeyDown={handleKeyDown}>
              <m.div
                className="fixed inset-0 z-[60] flex flex-col text-white outline-none"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.35, ease: EASE } }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
              >
                <Dialog.Title className="sr-only">Imagens de {name}</Dialog.Title>
                <Dialog.Description className="sr-only">
                  {multiple
                    ? 'Use as setas do teclado para navegar entre as imagens. Clique ou toque na imagem para ampliar.'
                    : 'Clique ou toque na imagem para ampliar.'}
                </Dialog.Description>

                <div className="flex shrink-0 items-center justify-between gap-4 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-6">
                  <p className="min-w-0 truncate text-sm font-semibold text-white/80">
                    {name}
                    {multiple && (
                      <span className="ml-2 font-medium text-white/50 tabular-nums">
                        {index + 1} / {count}
                      </span>
                    )}
                  </p>
                  <Dialog.Close
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-[background-color,transform] duration-200 hover:bg-white/20 active:scale-95"
                    aria-label="Fechar visualizador"
                  >
                    <X className="size-5" aria-hidden />
                  </Dialog.Close>
                </div>

                <div
                  className="relative min-h-0 flex-1 touch-pinch-zoom"
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={() => (swipe.current = null)}
                >
                  <AnimatePresence initial={false}>
                    <m.div
                      key={`${current}-${index}`}
                      className="absolute inset-0 sm:inset-x-20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { duration: 0.3, ease: EASE } }}
                      exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    >
                      <ZoomImage
                        path={current}
                        alt={multiple ? `${name} — imagem ${index + 1} de ${count}` : name}
                        sizes={VIEWER_SIZES}
                        mode="click"
                        onZoomChange={(active) => setZoomedIndex(active ? index : null)}
                        eagerHiRes
                        priority
                        className="[&_img]:bg-transparent!"
                      />
                    </m.div>
                  </AnimatePresence>

                  {multiple && (
                    <>
                      <ViewerArrow side="left" onClick={() => go(-1)} />
                      <ViewerArrow side="right" onClick={() => go(1)} />
                    </>
                  )}
                </div>

                {multiple ? (
                  <ul
                    aria-label="Miniaturas"
                    className="flex shrink-0 justify-center gap-2 overflow-x-auto px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] scrollbar-none"
                  >
                    {images.map((path, i) => (
                      <li key={`${path}-${i}`} className="shrink-0">
                        <button
                          type="button"
                          onClick={() => onIndexChange(i)}
                          aria-label={`Ver imagem ${i + 1} de ${count}`}
                          aria-current={i === index ? 'true' : undefined}
                          className={cn(
                            'relative block aspect-[5/6] w-12 overflow-hidden rounded-lg ring-2 ring-offset-2 ring-offset-ink-950 transition-[opacity,box-shadow] duration-300 ease-out-expo sm:w-14',
                            i === index ? 'ring-white' : 'opacity-50 ring-transparent hover:opacity-90',
                          )}
                        >
                          <ProductImage path={path} alt="" sizes={THUMB_IMAGE_SIZES} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="h-[max(1rem,env(safe-area-inset-bottom))] shrink-0" aria-hidden />
                )}
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

function ViewerArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Imagem anterior' : 'Próxima imagem'}
      className={cn(
        'absolute top-1/2 z-10 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-[background-color,transform] duration-200 hover:bg-white/20 active:scale-95 sm:inline-flex',
        side === 'left' ? 'left-4' : 'right-4',
      )}
    >
      <Icon className="size-6" aria-hidden />
    </button>
  )
}
