/**
 * Gera a imagem de compartilhamento (Open Graph) 1200×630 usada no index.html.
 *
 *   node scripts/build-og-image.mjs
 *
 * - Lê   public/brand/logo-palcomix.webp (selo oficial, recortado em círculo)
 * - Grava public/brand/og-image.jpg: fundo #0D0D0D com brilho azul, selo centralizado
 *   (sobrevive ao recorte quadrado da prévia do WhatsApp) e "Palco Mix · Calçados e Acessórios".
 */
import { statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const LOGO = join(ROOT, 'public/brand/logo-palcomix.webp')
const OUTPUT = join(ROOT, 'public/brand/og-image.jpg')

const WIDTH = 1200
const HEIGHT = 630
const LOGO_SIZE = 380
const LOGO_TOP = 64

const INK = '#0D0D0D'
const BRAND = '#0066FF'

// fundo: preto intenso + brilhos azuis (mesma linguagem do hero/rodapé)
const background = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="${BRAND}" stop-opacity="0.42" />
      <stop offset="55%" stop-color="${BRAND}" stop-opacity="0.08" />
      <stop offset="100%" stop-color="${BRAND}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="corner" cx="100%" cy="0%" r="60%">
      <stop offset="0%" stop-color="${BRAND}" stop-opacity="0.28" />
      <stop offset="100%" stop-color="${BRAND}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="${INK}" />
  <rect width="100%" height="100%" fill="url(#corner)" />
  <rect width="100%" height="100%" fill="url(#glow)" />
</svg>`

// texto: "Palco Mix · Calçados e Acessórios" (fonte do sistema — o SVG não carrega a Jakarta)
const text = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <text x="50%" y="${LOGO_TOP + LOGO_SIZE + 88}" text-anchor="middle"
    font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="50" font-weight="800" font-style="italic"
    letter-spacing="-1" fill="#FFFFFF">Palco Mix <tspan fill="${BRAND}">·</tspan> Calçados e Acessórios</text>
</svg>`

// o selo é quadrado com fundo escuro: recorta em círculo para não mostrar os cantos
const circleMask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${LOGO_SIZE}" height="${LOGO_SIZE}">
    <circle cx="${LOGO_SIZE / 2}" cy="${LOGO_SIZE / 2}" r="${LOGO_SIZE / 2}" fill="#fff" />
  </svg>`,
)
const logo = await sharp(LOGO)
  .resize(LOGO_SIZE, LOGO_SIZE)
  .ensureAlpha()
  .composite([{ input: circleMask, blend: 'dest-in' }])
  .png()
  .toBuffer()

await sharp(Buffer.from(background))
  .composite([
    { input: logo, top: LOGO_TOP, left: Math.round((WIDTH - LOGO_SIZE) / 2) },
    { input: Buffer.from(text), top: 0, left: 0 },
  ])
  .flatten({ background: INK })
  .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: '4:4:4' })
  .toFile(OUTPUT)

console.log(`✓ public/brand/og-image.jpg (${WIDTH}×${HEIGHT}, ${(statSync(OUTPUT).size / 1024).toFixed(0)} KB)`)
