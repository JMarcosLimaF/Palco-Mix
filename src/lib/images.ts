/**
 * Resolve as fontes responsivas de uma imagem de produto.
 *
 * Imagens em /produtos/ processadas por `npm run images` ganham srcset WebP
 * (400w/800w) + cor dominante para placeholder. Demais caminhos (uploads,
 * data URLs, URLs externas) são usados como estão.
 */
import manifestJson from '@/data/image-manifest.json'
import { publicAsset } from '@/lib/base-path'

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
  return publicAsset(`/produtos/_thumbs/${file}-${width}.webp`)
}

export function getImageSources(path: string | undefined): ImageSources {
  if (!path) return { src: publicAsset(PLACEHOLDER_IMAGE) }
  const entry = manifest[path]
  const srcPath = publicAsset(path)
  if (!entry) return { src: srcPath }

  const candidates = entry.sizes.map((w) => `${thumbPath(path, w)} ${w}w`)
  candidates.push(`${srcPath} ${entry.w}w`)
  const largestThumb = entry.sizes.at(-1)
  return {
    src: largestThumb ? thumbPath(path, largestThumb) : srcPath,
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
