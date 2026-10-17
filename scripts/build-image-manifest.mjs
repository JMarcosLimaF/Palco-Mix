/**
 * Gera miniaturas WebP (400w / 800w) e o manifesto de imagens do catálogo.
 *
 *   npm run images
 *
 * - Lê   public/produtos/*.{jpg,jpeg,png,webp}
 * - Grava public/produtos/_thumbs/<nome>-<largura>.webp (incremental: pula o que já existe)
 * - Grava src/data/image-manifest.json com dimensões, cor dominante e larguras disponíveis.
 *
 * O front usa o manifesto para montar srcset responsivo e placeholder de cor,
 * caindo para a imagem original quando o caminho não está no manifesto
 * (ex.: imagens enviadas pelo painel admin).
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC_DIR = join(ROOT, 'public/produtos')
const THUMB_DIR = join(SRC_DIR, '_thumbs')
const MANIFEST = join(ROOT, 'src/data/image-manifest.json')
const WIDTHS = [400, 800]

mkdirSync(THUMB_DIR, { recursive: true })

const files = readdirSync(SRC_DIR)
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .sort()

const toHex = ({ r, g, b }) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')

const manifest = {}
let generated = 0

for (const file of files) {
  const input = join(SRC_DIR, file)
  const name = basename(file, extname(file))
  const image = sharp(input)
  const [{ width, height }, stats] = await Promise.all([image.metadata(), image.stats()])

  const sizes = []
  for (const w of WIDTHS) {
    if (w >= width) continue
    const out = join(THUMB_DIR, `${name}-${w}.webp`)
    if (!existsSync(out)) {
      await sharp(input).resize({ width: w }).webp({ quality: 78, effort: 5 }).toFile(out)
      generated++
    }
    sizes.push(w)
  }

  manifest[`/produtos/${file}`] = { w: width, h: height, color: toHex(stats.dominant), sizes }
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 0) + '\n')
console.log(`manifesto: ${files.length} imagens · ${generated} miniaturas novas`)
