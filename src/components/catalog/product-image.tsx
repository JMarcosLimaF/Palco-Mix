import { useState, type ImgHTMLAttributes } from 'react'
import { getImageSources, PLACEHOLDER_IMAGE } from '@/lib/images'
import { cn } from '@/lib/utils'

export interface ProductImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  /** Caminho em /produtos/, data URL ou URL externa */
  path: string | undefined
  alt: string
  /** atributo `sizes` do srcset — informe a largura real renderizada */
  sizes?: string
  /** acima da dobra (hero / primeiro card): carrega com prioridade */
  priority?: boolean
  fit?: 'cover' | 'contain'
}

/**
 * Imagem de produto otimizada: srcset WebP responsivo, lazy loading,
 * placeholder na cor dominante e fade-in ao decodificar.
 * O elemento pai define a proporção (ex: `aspect-[5/6]`) e `position: relative`.
 */
export function ProductImage({
  path,
  alt,
  sizes = '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw',
  priority = false,
  fit = 'contain',
  className,
  style,
  onLoad,
  onError,
  ...props
}: ProductImageProps) {
  const [failed, setFailed] = useState(false)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const sources = getImageSources(failed ? PLACEHOLDER_IMAGE : path)
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
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      draggable={false}
      onLoad={(e) => {
        setLoadedSrc(sources.src)
        onLoad?.(e)
      }}
      onError={(e) => {
        if (!failed) setFailed(true)
        onError?.(e)
      }}
      style={{ backgroundColor: sources.color, ...style }}
      className={cn(
        'absolute inset-0 size-full transition-opacity duration-500 ease-out',
        fit === 'cover' ? 'object-cover' : 'object-contain',
        loaded || priority ? 'opacity-100' : 'opacity-0',
        className,
      )}
      {...props}
    />
  )
}
