import { CircleAlert, CircleCheck, ImageOff, LoaderCircle } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { ProductImage } from '@/components/catalog/product-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { PLACEHOLDER_IMAGE } from '@/lib/images'
import { cn } from '@/lib/utils'
import { imagePathError, normalizeImagePath } from './product-form-model'

export interface ImagePathAdderProps {
  /** imagens já no produto (evita duplicadas) */
  existing: string[]
  onAdd: (path: string) => void
  onClose: () => void
}

type Status = 'idle' | 'typing' | 'invalid' | 'duplicate' | 'loading' | 'ok' | 'error'

/** Adiciona imagem por caminho (/produtos/arquivo.jpg) ou URL https, com prévia antes de confirmar. */
export function ImagePathAdder({ existing, onAdd, onClose }: ImagePathAdderProps) {
  const inputId = useId()
  const statusId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [probe, setProbe] = useState<{ path: string; ok: boolean } | null>(null)
  const debounced = useDebouncedValue(value, 300)
  const candidate = normalizeImagePath(debounced)
  const settled = normalizeImagePath(value) === candidate
  const formatError = imagePathError(candidate)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  let status: Status
  if (!value.trim()) status = 'idle'
  else if (!settled) status = 'typing'
  else if (formatError) status = 'invalid'
  else if (existing.includes(candidate)) status = 'duplicate'
  else if (probe?.path === candidate) status = probe.ok ? 'ok' : 'error'
  else status = 'loading'

  const showPreview = status === 'loading' || status === 'ok' || status === 'error' || status === 'duplicate'

  function submit() {
    if (status !== 'ok') return
    onAdd(candidate)
    setValue('')
    setProbe(null)
    inputRef.current?.focus()
  }

  const message: Record<Status, { text: string; tone: 'muted' | 'danger' | 'warning' | 'success' }> = {
    idle: { text: 'Ex.: /produtos/foto.jpg ou https://site.com/imagem.webp', tone: 'muted' },
    typing: { text: 'Verificando…', tone: 'muted' },
    invalid: { text: formatError ?? '', tone: 'danger' },
    duplicate: { text: 'Esta imagem já está no produto.', tone: 'warning' },
    loading: { text: 'Carregando prévia…', tone: 'muted' },
    ok: { text: 'Imagem encontrada. Confira a prévia e adicione.', tone: 'success' },
    error: { text: 'Não foi possível carregar a imagem neste endereço.', tone: 'danger' },
  }
  const msg = message[status]

  return (
    <div className="animate-fade-in rounded-2xl border border-line bg-surface p-3 sm:p-4">
      <div className="flex gap-3 sm:gap-4">
        <div className="relative aspect-[5/6] w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2 ring-1 ring-line sm:w-24">
          {showPreview ? (
            <ProductImage
              key={candidate}
              path={candidate}
              alt="Prévia da imagem informada"
              sizes="96px"
              onLoad={(e) => {
                // o ProductImage troca por placeholder quando falha; ignore esse load
                if (e.currentTarget.getAttribute('src') !== PLACEHOLDER_IMAGE) setProbe({ path: candidate, ok: true })
              }}
              onError={() => setProbe({ path: candidate, ok: false })}
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-subtle">
              <ImageOff className="size-6" aria-hidden />
            </span>
          )}
          {status === 'loading' && (
            <span className="absolute inset-0 flex items-center justify-center bg-surface-2/70">
              <LoaderCircle className="size-5 animate-spin text-brand-500" aria-hidden />
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label htmlFor={inputId} className="text-sm font-semibold text-fg">
            Caminho ou URL da imagem
          </label>
          <Input
            ref={inputRef}
            id={inputId}
            value={value}
            onChange={(e) => setValue(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
              }
            }}
            placeholder="/produtos/arquivo.jpg"
            autoComplete="off"
            spellCheck={false}
            inputMode="url"
            aria-describedby={statusId}
            aria-invalid={status === 'invalid' || status === 'error' || undefined}
          />
          <p
            id={statusId}
            aria-live="polite"
            className={cn(
              'flex items-start gap-1.5 text-xs',
              msg.tone === 'muted' && 'text-subtle',
              msg.tone === 'danger' && 'font-medium text-danger-500',
              msg.tone === 'warning' && 'font-medium text-amber-600 dark:text-amber-400',
              msg.tone === 'success' && 'font-medium text-emerald-600 dark:text-emerald-400',
            )}
          >
            {msg.tone === 'success' && <CircleCheck className="mt-px size-3.5 shrink-0" aria-hidden />}
            {(msg.tone === 'danger' || msg.tone === 'warning') && <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />}
            {msg.text}
          </p>
          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={submit} disabled={status !== 'ok'}>
              Adicionar imagem
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
