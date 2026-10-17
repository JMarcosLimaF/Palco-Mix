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
        if (req.method !== 'POST') return send(405, { error: 'method not allowed' })
        const ext = EXT_BY_TYPE[String(req.headers['content-type'] ?? '').split(';')[0]]
        if (!ext) return send(415, { error: 'tipo de imagem não suportado' })

        const chunks: Buffer[] = []
        let size = 0
        for await (const chunk of req) {
          size += chunk.length
          if (size > MAX_UPLOAD_BYTES) return send(413, { error: 'imagem maior que 8 MB' })
          chunks.push(chunk as Buffer)
        }

        const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        await mkdir(UPLOAD_DIR, { recursive: true })
        await writeFile(`${UPLOAD_DIR}/${name}`, Buffer.concat(chunks))
        send(201, { path: `/produtos/uploads/${name}` })
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
