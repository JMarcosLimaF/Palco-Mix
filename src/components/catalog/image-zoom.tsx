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
}

/**
 * Imagem com zoom ~2x seguindo o cursor (transform-origin), só com mouse.
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
}: ZoomImageProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const [hiResWanted, setHiResWanted] = useState(eagerHiRes)
  const [hiResLoaded, setHiResLoaded] = useState(false)
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const hiResSrc = path && !path.startsWith('data:') ? path : undefined
  const zoomable = mode !== 'none' && finePointer && Boolean(path)

  function moveOrigin(event: PointerEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) {
    const layer = layerRef.current
    if (!layer) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100)
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100)
    layer.style.transformOrigin = `${x}% ${y}%`
  }

  function activate(event: PointerEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) {
    moveOrigin(event)
    setActive(true)
    setHiResWanted(true)
  }

  return (
    <div
      className={cn(
        'absolute inset-0 overflow-hidden',
        zoomable && (active ? 'cursor-zoom-out' : 'cursor-zoom-in'),
        className,
      )}
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
              if (e.pointerType === 'mouse' && active) moveOrigin(e)
            }
          : undefined
      }
      onPointerLeave={zoomable && mode === 'hover' ? () => setActive(false) : undefined}
      onClick={(e) => {
        if (zoomable && mode === 'click') {
          if (active) setActive(false)
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
