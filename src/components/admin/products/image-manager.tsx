import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CloudUpload,
  GripVertical,
  LibraryBig,
  Link2,
  LoaderCircle,
  RotateCcw,
  Star,
  TriangleAlert,
  Upload,
  X,
} from 'lucide-react'
import { m } from 'motion/react'
import { useEffect, useRef, useState, type DragEvent } from 'react'
import { toast } from 'sonner'
import { ImageLibraryDialog } from '@/components/admin/image-library-dialog'
import { ProductImage } from '@/components/catalog/product-image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ACCEPTED_IMAGE_TYPES, uploadProductImage } from '@/lib/upload'
import { cn } from '@/lib/utils'
import { errorMessage } from '@/services/errors'
import { ImagePathAdder } from './image-path-adder'

export type ImagesUpdater = (update: (prev: string[]) => string[]) => void

export interface ImageManagerProps {
  images: string[]
  onChange: ImagesUpdater
  /** usado no texto alternativo das miniaturas */
  productName: string
}

type UploadStatus = 'queued' | 'uploading' | 'error'

interface UploadItem {
  id: string
  file: File
  name: string
  /** object URL para a prévia local ('' quando o formato não é suportado) */
  preview: string
  status: UploadStatus
  error?: string
  /** erro definitivo (formato/tamanho) — não adianta tentar de novo */
  fatal?: boolean
}

const ACCEPTED = ACCEPTED_IMAGE_TYPES.split(',')
const MAX_FILE_BYTES = 25 * 1024 * 1024
const EASE = [0.16, 1, 0.3, 1] as const

/** Botão circular sobre a miniatura (vidro claro). */
const tileBtn =
  'inline-flex size-9 items-center justify-center rounded-full bg-white/90 text-ink-950 shadow-sm backdrop-blur ' +
  'transition-[background-color,color,opacity,transform] duration-200 ease-out-expo hover:bg-white active:scale-90 ' +
  'focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ' +
  'disabled:pointer-events-none disabled:opacity-35'

function hasFiles(e: DragEvent) {
  return Array.from(e.dataTransfer.types).includes('Files')
}

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/**
 * Gerenciador de imagens do produto: grade ordenável (arrastar ou botões),
 * upload local com fila e progresso, biblioteca /produtos/ e caminho manual.
 * A 1ª imagem é a capa ("Principal") em toda a loja.
 */
export function ImageManager({ images, onChange, productName }: ImageManagerProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [pathOpen, setPathOpen] = useState(false)
  const [dropActive, setDropActive] = useState(false)
  const [drag, setDrag] = useState<{ from: number; over: number | null } | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadButtonRef = useRef<HTMLButtonElement>(null)
  const tileRefs = useRef(new Map<string, HTMLDivElement>())
  const onChangeRef = useRef(onChange)
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  const seqRef = useRef(0)
  const cancelledRef = useRef(new Set<string>())
  const previewsRef = useRef(new Set<string>())
  const dropDepthRef = useRef(0)

  useEffect(() => {
    onChangeRef.current = onChange
  })

  // libera as prévias locais ao sair da tela
  useEffect(() => {
    const previews = previewsRef.current
    return () => {
      for (const url of previews) URL.revokeObjectURL(url)
      previews.clear()
    }
  }, [])

  const name = productName.trim() || 'Produto'

  // ------------------------------------------------------------ reordenação
  function move(from: number, to: number, focusAction?: 'left' | 'right' | 'main') {
    const path = images[from]
    if (path === undefined || to < 0 || to >= images.length || from === to) return
    onChange((prev) => moveItem(prev, prev.indexOf(path), to))
    setAnnouncement(
      to === 0 ? `Imagem definida como principal.` : `Imagem movida para a posição ${to + 1} de ${images.length}.`,
    )
    if (focusAction) {
      // o nó do bloco pode ser movido no DOM e perder o foco: devolve ao botão equivalente
      requestAnimationFrame(() => {
        const tile = tileRefs.current.get(path)
        const preferred = tile?.querySelector<HTMLButtonElement>(`[data-act="${focusAction}"]:not(:disabled)`)
        const fallback = tile?.querySelector<HTMLButtonElement>('[data-act]:not(:disabled)')
        ;(preferred ?? fallback)?.focus()
      })
    }
  }

  function removeAt(index: number) {
    const path = images[index]
    if (path === undefined) return
    onChange((prev) => prev.filter((p) => p !== path))
    setAnnouncement(`Imagem ${index + 1} removida.`)
    // o botão some junto com a imagem: leva o foco para a vizinha (ou para "Enviar imagens")
    const neighbor = images[index + 1] ?? images[index - 1]
    requestAnimationFrame(() => {
      const next = neighbor ? tileRefs.current.get(neighbor)?.querySelector<HTMLButtonElement>('[data-act="remove"]') : null
      ;(next ?? uploadButtonRef.current)?.focus()
    })
    toast('Imagem removida', {
      description: 'Ela só sai do produto quando você salvar.',
      action: {
        label: 'Desfazer',
        onClick: () =>
          onChangeRef.current((prev) =>
            prev.includes(path) ? prev : [...prev.slice(0, index), path, ...prev.slice(index)],
          ),
      },
    })
  }

  function addPaths(paths: string[]) {
    if (paths.length === 0) return
    onChange((prev) => {
      const fresh = paths.filter((p) => !prev.includes(p))
      return fresh.length ? [...prev, ...fresh] : prev
    })
    setAnnouncement(paths.length === 1 ? 'Imagem adicionada.' : `${paths.length} imagens adicionadas.`)
  }

  // ------------------------------------------------------------ upload
  function patchUpload(id: string, patch: Partial<UploadItem>) {
    setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }

  function discardUpload(item: UploadItem) {
    cancelledRef.current.add(item.id)
    if (item.preview) {
      URL.revokeObjectURL(item.preview)
      previewsRef.current.delete(item.preview)
    }
    setUploads((list) => list.filter((u) => u.id !== item.id))
  }

  async function processUpload(item: UploadItem) {
    if (cancelledRef.current.has(item.id)) return
    patchUpload(item.id, { status: 'uploading', error: undefined })
    try {
      const path = await uploadProductImage(item.file)
      if (cancelledRef.current.has(item.id)) return
      onChangeRef.current((prev) => (prev.includes(path) ? prev : [...prev, path]))
      discardUpload(item)
      setAnnouncement(`${item.name} enviada.`)
    } catch (err) {
      patchUpload(item.id, { status: 'error', error: errorMessage(err, 'Falha ao processar a imagem.') })
      toast.error(`Não foi possível enviar ${item.name}`, { description: errorMessage(err) })
    }
  }

  function schedule(item: UploadItem) {
    // fila sequencial: mantém a ordem escolhida e não trava o navegador com vários canvas
    queueRef.current = queueRef.current.then(() => processUpload(item))
  }

  function enqueue(fileList: FileList | File[] | null) {
    const files = Array.from(fileList ?? [])
    if (files.length === 0) return
    const items = files.map<UploadItem>((file) => {
      seqRef.current += 1
      const unsupported = !ACCEPTED.includes(file.type)
      const tooBig = file.size > MAX_FILE_BYTES
      const preview = unsupported ? '' : URL.createObjectURL(file)
      if (preview) previewsRef.current.add(preview)
      return {
        id: `upload-${seqRef.current}`,
        file,
        name: file.name,
        preview,
        status: unsupported || tooBig ? 'error' : 'queued',
        error: unsupported ? 'Formato não suportado' : tooBig ? 'Arquivo acima de 25 MB' : undefined,
        fatal: unsupported || tooBig,
      }
    })
    setUploads((list) => [...list, ...items])
    items.filter((i) => i.status === 'queued').forEach(schedule)
    setAnnouncement(files.length === 1 ? 'Enviando 1 imagem…' : `Enviando ${files.length} imagens…`)
  }

  function retry(item: UploadItem) {
    patchUpload(item.id, { status: 'queued', error: undefined })
    schedule(item)
  }

  // ------------------------------------------------------------ arrastar arquivos
  const dropHandlers = {
    onDragEnter: (e: DragEvent<HTMLDivElement>) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      dropDepthRef.current += 1
      setDropActive(true)
    },
    onDragOver: (e: DragEvent<HTMLDivElement>) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    },
    onDragLeave: (e: DragEvent<HTMLDivElement>) => {
      if (!hasFiles(e)) return
      dropDepthRef.current = Math.max(0, dropDepthRef.current - 1)
      if (dropDepthRef.current === 0) setDropActive(false)
    },
    onDrop: (e: DragEvent<HTMLDivElement>) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      dropDepthRef.current = 0
      setDropActive(false)
      enqueue(e.dataTransfer.files)
    },
  }

  const busyUploads = uploads.filter((u) => u.status !== 'error').length

  return (
    // soltar arquivos em qualquer ponto do gerenciador também envia (e evita o navegador abrir o arquivo)
    <div className="flex flex-col gap-4" {...dropHandlers}>
      {(images.length > 0 || uploads.length > 0) && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-label="Imagens do produto">
          {images.map((path, index) => {
            const isFirst = index === 0
            const isLast = index === images.length - 1
            const dragging = drag?.from === index
            const target = drag !== null && drag.over === index && drag.from !== index
            return (
              <m.li key={path} layout transition={{ layout: { duration: 0.35, ease: EASE } }}>
                <div
                  ref={(el) => {
                    if (el) tileRefs.current.set(path, el)
                    else tileRefs.current.delete(path)
                  }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', String(index))
                    setDrag({ from: index, over: null })
                  }}
                  onDragOver={(e) => {
                    if (!drag) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    if (drag.over !== index) setDrag({ ...drag, over: index })
                  }}
                  onDrop={(e) => {
                    if (!drag) return
                    e.preventDefault()
                    move(drag.from, index)
                    setDrag(null)
                  }}
                  onDragEnd={() => setDrag(null)}
                  className={cn(
                    'group/tile relative aspect-[5/6] cursor-grab overflow-hidden rounded-xl bg-surface-2 ring-1 ring-black/[0.05] active:cursor-grabbing dark:ring-white/[0.07]',
                    'transition-[opacity,box-shadow,transform] duration-200 ease-out-expo',
                    isFirst && 'ring-2 ring-brand-500/70 dark:ring-brand-500/70',
                    dragging && 'scale-[0.97] opacity-40',
                    target && 'shadow-glow ring-2 ring-brand-500',
                  )}
                >
                  <ProductImage
                    path={path}
                    alt={`${name} — imagem ${index + 1}${isFirst ? ' (principal)' : ''}`}
                    sizes="(min-width: 1280px) 160px, (min-width: 640px) 200px, 45vw"
                  />

                  <div className="pointer-events-none absolute top-2 left-2 flex items-center gap-1">
                    {isFirst ? (
                      <Badge tone="brand" className="shadow-sm">
                        <Star className="size-3 fill-current" aria-hidden />
                        Principal
                      </Badge>
                    ) : (
                      <Badge tone="glass" className="min-w-6 justify-center px-2 tabular-nums">
                        {index + 1}
                      </Badge>
                    )}
                  </div>

                  <span
                    className="pointer-events-none absolute top-2 left-1/2 hidden -translate-x-1/2 rounded-full bg-black/45 p-0.5 text-white opacity-0 transition-opacity group-hover/tile:opacity-100 md:block"
                    aria-hidden
                  >
                    <GripVertical className="size-3.5 rotate-90" />
                  </span>

                  <button
                    type="button"
                    data-act="remove"
                    onClick={() => removeAt(index)}
                    aria-label={`Remover imagem ${index + 1}`}
                    title="Remover"
                    className={cn(
                      tileBtn,
                      'absolute top-2 right-2 hover:bg-danger-600 hover:text-white',
                      'md:opacity-0 md:group-focus-within/tile:opacity-100 md:group-hover/tile:opacity-100',
                    )}
                  >
                    <X className="size-4" aria-hidden />
                  </button>

                  <div
                    className={cn(
                      'absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/55 to-transparent p-2 pt-6',
                      'transition-opacity duration-200 md:opacity-0 md:group-focus-within/tile:opacity-100 md:group-hover/tile:opacity-100',
                    )}
                  >
                    <button
                      type="button"
                      data-act="left"
                      onClick={() => move(index, index - 1, 'left')}
                      disabled={isFirst}
                      aria-label={`Mover imagem ${index + 1} para a esquerda`}
                      title="Mover para a esquerda"
                      className={tileBtn}
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                    </button>
                    {!isFirst && (
                      <button
                        type="button"
                        data-act="main"
                        onClick={() => move(index, 0, 'main')}
                        aria-label={`Tornar a imagem ${index + 1} a principal`}
                        title="Tornar principal"
                        className={cn(tileBtn, 'hover:text-brand-600')}
                      >
                        <Star className="size-4" aria-hidden />
                      </button>
                    )}
                    <button
                      type="button"
                      data-act="right"
                      onClick={() => move(index, index + 1, 'right')}
                      disabled={isLast}
                      aria-label={`Mover imagem ${index + 1} para a direita`}
                      title="Mover para a direita"
                      className={tileBtn}
                    >
                      <ChevronRight className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </m.li>
            )
          })}

          {uploads.map((u) => (
            <li key={u.id} className="animate-fade-in">
              <div
                className={cn(
                  'relative aspect-[5/6] overflow-hidden rounded-xl bg-surface-2 ring-1',
                  u.status === 'error' ? 'ring-danger-500/50' : 'ring-line',
                )}
              >
                {u.preview && (
                  // prévia local (blob) enquanto a imagem é otimizada
                  <img
                    src={u.preview}
                    alt=""
                    className={cn('absolute inset-0 size-full object-contain', u.status === 'error' ? 'opacity-25' : 'opacity-50')}
                  />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
                  {u.status === 'error' ? (
                    <>
                      <CircleAlert className="size-6 text-danger-500" aria-hidden />
                      <p className="text-xs font-semibold text-fg">{u.error}</p>
                      <p className="w-full truncate text-[0.6875rem] text-muted" title={u.name}>
                        {u.name}
                      </p>
                      <div className="flex gap-1.5">
                        {!u.fatal && (
                          <button
                            type="button"
                            onClick={() => retry(u)}
                            aria-label={`Tentar enviar ${u.name} novamente`}
                            title="Tentar de novo"
                            className={tileBtn}
                          >
                            <RotateCcw className="size-4" aria-hidden />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => discardUpload(u)}
                          aria-label={`Descartar ${u.name}`}
                          title="Descartar"
                          className={tileBtn}
                        >
                          <X className="size-4" aria-hidden />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex size-10 items-center justify-center rounded-full bg-elevated/90 shadow-card">
                        <LoaderCircle
                          className={cn('size-5 text-brand-500', u.status === 'uploading' && 'animate-spin')}
                          aria-hidden
                        />
                      </span>
                      <p className="rounded-full bg-elevated/90 px-2.5 py-1 text-[0.6875rem] font-semibold text-fg">
                        {u.status === 'uploading' ? 'Otimizando…' : 'Na fila'}
                      </p>
                      <p className="w-full truncate text-[0.6875rem] text-muted" title={u.name}>
                        {u.name}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* zona de envio: arrastar e soltar + 3 caminhos */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 text-center',
          'transition-[border-color,background-color] duration-200 ease-out-expo',
          images.length === 0 && uploads.length === 0 ? 'py-10' : 'py-6',
          dropActive ? 'border-brand-500 bg-brand-500/[0.06]' : 'border-line-strong bg-surface/50',
        )}
      >
        <span
          className={cn(
            'inline-flex size-12 items-center justify-center rounded-2xl bg-elevated text-brand-500 shadow-card ring-1 ring-line transition-transform duration-300 ease-out-expo',
            dropActive && '-translate-y-1 scale-110',
          )}
        >
          <CloudUpload className="size-6" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-fg">
            {dropActive ? 'Solte para enviar' : 'Arraste e solte imagens aqui'}
          </p>
          <p className="mt-0.5 text-xs text-muted">JPG, PNG, WebP ou AVIF · otimizadas automaticamente</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button ref={uploadButtonRef} size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload aria-hidden />
            Enviar imagens
          </Button>
          <Button size="sm" variant="outline" onClick={() => setLibraryOpen(true)}>
            <LibraryBig aria-hidden />
            Escolher da biblioteca
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPathOpen((o) => !o)} aria-expanded={pathOpen}>
            <Link2 aria-hidden />
            Informar caminho
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            enqueue(e.currentTarget.files)
            e.currentTarget.value = ''
          }}
        />
        {busyUploads > 0 && (
          <p className="text-xs font-medium text-brand-600 dark:text-brand-400" aria-hidden>
            Processando {busyUploads === 1 ? '1 imagem' : `${busyUploads} imagens`}…
          </p>
        )}
      </div>

      {pathOpen && (
        <ImagePathAdder
          existing={images}
          onAdd={(path) => addPaths([path])}
          onClose={() => setPathOpen(false)}
        />
      )}

      {images.length === 0 && uploads.length === 0 && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-3.5 py-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
          <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden />
          Recomendado: adicione pelo menos uma imagem. Sem foto, o produto aparece com a logo da loja na vitrine.
        </p>
      )}

      <ImageLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={(paths) => addPaths(paths)}
        multiple
        exclude={images}
      />

      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  )
}
