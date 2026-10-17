/**
 * Resolve as fontes responsivas de uma imagem de produto.
 *
 * Imagens em /produtos/ processadas por `npm run images` ganham srcset WebP
 * (400w/800w) + cor dominante para placeholder. Demais caminhos (uploads,
 * data URLs, URLs externas) são usados como estão.
 */
import manifestJson from '@/data/image-manifest.json'

interface ManifestEntry {
  w: number
  h: number
  color: string
  sizes: number[]
}

const manifest = manifestJson as Record<string, ManifestEntry>

export interface ImageSources {
  src: string
  srcSet?: string
  /** cor dominante para placeholder enquanto carrega */
  color?: string
  width?: number
  height?: number
}

/** Imagem neutra usada quando o produto não tem foto. */
export const PLACEHOLDER_IMAGE = '/brand/logo-palcomix-320.webp'

function thumbPath(path: string, width: number): string {
  const file = path.slice('/produtos/'.length).replace(/\.[^.]+$/, '')
  return `/produtos/_thumbs/${file}-${width}.webp`
}

export function getImageSources(path: string | undefined): ImageSources {
  if (!path) return { src: PLACEHOLDER_IMAGE }
  const entry = manifest[path]
  if (!entry) return { src: path }

  const candidates = entry.sizes.map((w) => `${thumbPath(path, w)} ${w}w`)
  candidates.push(`${path} ${entry.w}w`)
  const largestThumb = entry.sizes.at(-1)
  return {
    src: largestThumb ? thumbPath(path, largestThumb) : path,
    srcSet: candidates.join(', '),
    color: entry.color,
    width: entry.w,
    height: entry.h,
  }
}

/** Lista de imagens disponíveis em /produtos/ (seletor do painel admin). */
export function listLibraryImages(): string[] {
  return Object.keys(manifest)
}

/** Pré-carrega uma imagem (ex: próxima do carrossel). */
export function preloadImage(path: string, sizes = '100vw') {
  const { src, srcSet } = getImageSources(path)
  const img = new Image()
  img.decoding = 'async'
  if (srcSet) {
    img.sizes = sizes
    img.srcset = srcSet
  }
  img.src = src
}
