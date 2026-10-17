/**
 * Upload de imagem de produto feito pelo painel admin.
 *
 * 1. Redimensiona/comprime no navegador (WebP) — fotos de celular viram ~100 KB.
 * 2. Em `npm run dev`, envia ao middleware do Vite que grava em
 *    public/produtos/uploads/ e devolve o caminho público.
 * 3. Fora do dev (build estático), devolve um data URL que fica salvo
 *    junto do produto no armazenamento local.
 */

const DISK_MAX_EDGE = 1600
const INLINE_MAX_EDGE = 1000

async function loadBitmap(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file)
    } catch {
      /* cai para <img> (ex.: HEIC em alguns navegadores) */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function compressImage(file: Blob, maxEdge: number, quality = 0.82): Promise<Blob> {
  const source = await loadBitmap(file)
  const { width, height } = source
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível neste navegador.')
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  if ('close' in source) source.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  if (blob && blob.type === 'image/webp') return blob
  // Safari/iOS não exporta WebP: cai para JPEG, que não tem alfa. Compõe sobre
  // branco, senão as áreas transparentes de um PNG recortado ficam pretas.
  ctx.globalCompositeOperation = 'destination-over'
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!jpeg) throw new Error('Não foi possível processar a imagem.')
  return jpeg
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/avif'

/**
 * Processa e armazena a imagem; devolve o valor a salvar em `product.images`.
 * `signal` cancela o envio (ex.: o formulário foi fechado) antes de gravar em disco.
 */
export async function uploadProductImage(file: File, signal?: AbortSignal): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Selecione um arquivo de imagem.')

  if (import.meta.env.DEV) {
    try {
      const blob = await compressImage(file, DISK_MAX_EDGE)
      signal?.throwIfAborted()
      // sem resposta em 30s (servidor travado) → cai para o data URL em vez de prender o formulário
      const timeout = AbortSignal.timeout(30_000)
      const res = await fetch('/__dev/upload', {
        method: 'POST',
        headers: { 'content-type': blob.type },
        body: blob,
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      })
      if (res.ok) {
        const { path } = (await res.json()) as { path: string }
        return path
      }
    } catch (err) {
      if (signal?.aborted) throw err
      /* segue para data URL */
    }
  }

  const inline = await compressImage(file, INLINE_MAX_EDGE, 0.78)
  signal?.throwIfAborted()
  return blobToDataUrl(inline)
}
