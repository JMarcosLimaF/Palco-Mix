import { useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { getImageSources, PLACEHOLDER_IMAGE } from '@/lib/images'
import { clamp, cn } from '@/lib/utils'
import { cappedImageSources } from './catalog-helpers'

export interface GalleryImageProps {
  path: string | undefined
  alt: string
  sizes: string
  priority?: boolean
  className?: string
}

/**
 * Imagem principal da galeria: srcset WebP limitado a 800w (o original em alta
 * fica reservado ao zoom/visualizador), cor dominante de fundo e fade-in.
 * Sempre `object-contain` — as artes têm texto e preço embutidos.
 */
export function GalleryImage({ path, alt, sizes, priority = false, className }: GalleryImageProps) {
  const [failed, setFailed] = useState(false)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const sources = failed ? getImageSources(PLACEHOLDER_IMAGE) : cappedImageSources(path)
  const loaded = loadedSrc === sources.src

  return (
    <img
      src={sources.src}
      srcSet={sources.srcSet}
      sizes={sources.srcSet ? sizes : undefined}
      width={sources.width}
      height={sources.height}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      draggable={false}
      onLoad={() => setLoadedSrc(sources.src)}
      onError={() => !failed && setFailed(true)}
      style={{ backgroundColor: sources.color }}
      className={cn(
        'absolute inset-0 size-full object-contain transition-opacity duration-500 ease-out',
        loaded ? 'opacity-100' : 'opacity-0',
        className,
      )}
    />
  )
}

export interface ZoomImageProps extends GalleryImageProps {
  /**
   * hover = amplia seguindo o cursor ao passar o mouse (galeria);
   * click = clique alterna o zoom (visualizador em tela cheia);
   * none = sem zoom.
   */
  mode?: 'hover' | 'click' | 'none'
  scale?: number
  /** baixa o original em alta já na montagem (visualizador) */
  eagerHiRes?: boolean
  onClick?: (event: MouseEvent<HTMLDivElement>) => void
  /** avisa quando o zoom liga/desliga (o visualizador suspende swipe/fechar) */
  onZoomChange?: (active: boolean) => void
}

/** Distância (px) a partir da qual um toque vira arrasto. */
const DRAG_SLOP = 6

/**
 * Imagem com zoom ~2x seguindo o cursor (transform-origin).
 * hover: só com mouse. click: mouse ou toque — no toque, tocar alterna o zoom
 * e, ampliada, arrastar com um dedo move a imagem (sem trocar nem fechar).
 * O arquivo original em alta resolução é carregado quando o zoom é ativado
 * pela primeira vez e cobre a versão de 800w assim que decodifica.
 */
export function ZoomImage({
  path,
  alt,
  sizes,
  priority,
  className,
  mode = 'hover',
  scale = 2,
  eagerHiRes = false,
  onClick,
  onZoomChange,
}: ZoomImageProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const [hiResWanted, setHiResWanted] = useState(eagerHiRes)
  const [hiResLoaded, setHiResLoaded] = useState(false)
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const hiResSrc = path && !path.startsWith('data:') ? path : undefined
  const zoomable = Boolean(path) && (mode === 'click' || (mode === 'hover' && finePointer))
  // arrasto com o dedo sobre a imagem ampliada (modo click)
  const pannable = zoomable && mode === 'click' && active
  const origin = useRef({ x: 50, y: 50 })
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null)
  const dragged = useRef(false)

  function setOrigin(x: number, y: number) {
    origin.current = { x: clamp(x, 0, 100), y: clamp(y, 0, 100) }
    if (layerRef.current) layerRef.current.style.transformOrigin = `${origin.current.x}% ${origin.current.y}%`
  }

  function moveOrigin(event: PointerEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    setOrigin(((event.clientX - rect.left) / rect.width) * 100, ((event.clientY - rect.top) / rect.height) * 100)
  }

  function changeActive(next: boolean) {
    setActive(next)
    onZoomChange?.(next)
  }

  function activate(event: PointerEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) {
    moveOrigin(event)
    changeActive(true)
    setHiResWanted(true)
  }

  function handlePanStart(event: PointerEvent<HTMLDivElement>) {
    dragged.current = false
    if (!pannable || event.pointerType === 'mouse') return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, y: event.clientY, ox: origin.current.x, oy: origin.current.y, moved: false }
  }

  function handlePanMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.moved && Math.hypot(dx, dy) < DRAG_SLOP) return
    start.moved = true
    // mover a origem no sentido oposto ao dedo desloca a imagem junto com ele
    const rect = event.currentTarget.getBoundingClientRect()
    const factor = 100 / (scale - 1)
    setOrigin(start.ox - (dx / rect.width) * factor, start.oy - (dy / rect.height) * factor)
  }

  function handlePanEnd() {
    // um arrasto não deve alternar o zoom no "click" que alguns navegadores disparam depois
    if (drag.current?.moved) dragged.current = true
    drag.current = null
  }

  return (
    <div
      className={cn(
        'absolute inset-0 overflow-hidden',
        zoomable && (active ? 'cursor-zoom-out' : 'cursor-zoom-in'),
        // ampliada no toque: o dedo move a imagem (nada de pan/pinça do navegador)
        pannable && 'touch-none',
        className,
      )}
      onPointerDown={zoomable && mode === 'click' ? handlePanStart : undefined}
      onPointerUp={zoomable && mode === 'click' ? handlePanEnd : undefined}
      onPointerCancel={zoomable && mode === 'click' ? handlePanEnd : undefined}
      onPointerEnter={
        zoomable && mode === 'hover'
          ? (e) => {
              if (e.pointerType === 'mouse') activate(e)
            }
          : undefined
      }
      onPointerMove={
        zoomable
          ? (e) => {
              if (e.pointerType === 'mouse') {
                if (active) moveOrigin(e)
              } else handlePanMove(e)
            }
          : undefined
      }
      onPointerLeave={zoomable && mode === 'hover' ? () => changeActive(false) : undefined}
      onClick={(e) => {
        if (dragged.current) {
          dragged.current = false
          return
        }
        if (zoomable && mode === 'click') {
          if (active) changeActive(false)
          else activate(e)
        }
        onClick?.(e)
      }}
    >
      <div
        ref={layerRef}
        className="absolute inset-0 transition-transform duration-500 ease-out-expo will-change-transform"
        style={{ transform: zoomable && active ? `scale(${scale})` : 'none' }}
      >
        <GalleryImage path={path} alt={alt} sizes={sizes} priority={priority} />
        {hiResWanted && hiResSrc && (
          <img
            src={hiResSrc}
            alt=""
            aria-hidden
            decoding="async"
            draggable={false}
            onLoad={() => setHiResLoaded(true)}
            className={cn(
              'absolute inset-0 size-full object-contain transition-opacity duration-300 ease-out',
              hiResLoaded ? 'opacity-100' : 'opacity-0',
            )}
          />
        )}
      </div>
    </div>
  )
}
