import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const UPLOAD_DIR = fileURLToPath(new URL('./public/produtos/uploads', import.meta.url))
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
const EXT_BY_TYPE: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/avif': 'avif',
}

/** Confere a assinatura (magic bytes) do arquivo com o tipo declarado no header. */
function matchesImageSignature(buf: Buffer, type: string): boolean {
  const ascii = (start: number, end: number) => buf.toString('latin1', start, end)
  switch (type) {
    case 'image/jpeg':
      return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
    case 'image/png':
      return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    case 'image/webp':
      return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP'
    case 'image/avif':
      // caixa ftyp com a marca avif/avis (principal ou compatível)
      return buf.length > 12 && ascii(4, 8) === 'ftyp' && /avi[fs]/.test(ascii(8, Math.min(buf.readUInt32BE(0), 64)))
    default:
      return false
  }
}

/**
 * Somente em `npm run dev`: recebe uploads do painel admin e grava em
 * public/produtos/uploads/, devolvendo o caminho público (/produtos/uploads/...).
 * Em produção (build estático) o front cai para data URL no armazenamento local.
 */
function devUploadPlugin(): Plugin {
  return {
    name: 'palcomix:dev-upload',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev/upload', async (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(body))
        }
        // o connect ignora a promise do middleware: qualquer falha precisa virar resposta aqui
        try {
          if (req.method !== 'POST') return send(405, { error: 'method not allowed' })
          const type = String(req.headers['content-type'] ?? '').split(';')[0]
          const ext = EXT_BY_TYPE[type]
          if (!ext) return send(415, { error: 'tipo de imagem não suportado' })

          const chunks: Buffer[] = []
          let size = 0
          for await (const chunk of req) {
            size += chunk.length
            if (size > MAX_UPLOAD_BYTES) return send(413, { error: 'imagem maior que 8 MB' })
            chunks.push(chunk as Buffer)
          }
          const body = Buffer.concat(chunks)
          if (!matchesImageSignature(body, type)) return send(415, { error: 'o conteúdo não é uma imagem válida' })

          const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`
          await mkdir(UPLOAD_DIR, { recursive: true })
          await writeFile(`${UPLOAD_DIR}/${name}`, body)
          send(201, { path: `/produtos/uploads/${name}` })
        } catch (err) {
          server.config.logger.error(`[dev-upload] falha ao gravar a imagem: ${String(err)}`)
          if (!res.headersSent) send(500, { error: 'falha ao gravar a imagem' })
          else res.end()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devUploadPlugin()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // uploads gravados em public/ não devem disparar reload da página
    watch: { ignored: ['**/public/produtos/**'] },
  },
  build: {
    rolldownOptions: {
      output: {
        // bibliotecas estáveis em chunks próprios: mudam pouco entre deploys → cache longo.
        // (só libs usadas na carga inicial; as do admin continuam nos chunks lazy)
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/ },
            {
              name: 'vendor',
              test: /node_modules[\\/](@tanstack|@radix-ui|sonner|zustand|react-remove-scroll|react-remove-scroll-bar|react-style-singleton|use-callback-ref|use-sidecar|aria-hidden|get-nonce|tslib)[\\/]/,
            },
          ],
        },
      },
    },
  },
})
