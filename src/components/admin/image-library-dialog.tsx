import { Check, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProductImage } from '@/components/catalog/product-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import { Modal } from '@/components/ui/modal'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { listLibraryImages } from '@/lib/images'
import { cn } from '@/lib/utils'

export interface ImageLibraryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Recebe os caminhos escolhidos ('/produtos/arquivo.JPG') */
  onSelect: (paths: string[]) => void
  multiple?: boolean
  /** Caminhos já usados (aparecem marcados e desabilitados) */
  exclude?: string[]
  title?: string
}

const PAGE = 48

/** Biblioteca de imagens de /public/produtos/ (geradas por `npm run images`). */
export function ImageLibraryDialog({
  open,
  onOpenChange,
  onSelect,
  multiple = true,
  exclude = [],
  title = 'Biblioteca de imagens',
}: ImageLibraryDialogProps) {
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [limit, setLimit] = useState(PAGE)
  const term = useDebouncedValue(search.trim().toLowerCase(), 150)
  const all = useMemo(() => listLibraryImages(), [])
  const excluded = useMemo(() => new Set(exclude), [exclude])
  const filtered = useMemo(() => (term ? all.filter((p) => p.toLowerCase().includes(term)) : all), [all, term])

  function toggle(path: string) {
    if (!multiple) {
      onSelect([path])
      onOpenChange(false)
      return
    }
    setPicked((cur) => (cur.includes(path) ? cur.filter((p) => p !== path) : [...cur, path]))
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setPicked([])
      setSearch('')
      setLimit(PAGE)
    }
    onOpenChange(next)
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={`${all.length} imagens em /produtos/ · ${multiple ? 'selecione uma ou mais' : 'clique para escolher'}`}
      size="2xl"
      footer={
        multiple ? (
          <>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={picked.length === 0}
              onClick={() => {
                onSelect(picked)
                handleOpenChange(false)
              }}
            >
              Adicionar {picked.length > 0 ? `(${picked.length})` : ''}
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="sticky top-0 z-10 -mx-1 bg-elevated px-1 pb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setLimit(PAGE)
            }}
            placeholder="Filtrar pelo nome do arquivo…"
            className="pl-10"
            aria-label="Filtrar imagens"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Nenhuma imagem encontrada.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
          {filtered.slice(0, limit).map((path) => {
            const used = excluded.has(path)
            const order = picked.indexOf(path)
            const selected = order >= 0
            return (
              <li key={path}>
                <button
                  type="button"
                  disabled={used}
                  onClick={() => toggle(path)}
                  aria-pressed={selected}
                  title={path}
                  className={cn(
                    'group relative block aspect-[5/6] w-full overflow-hidden rounded-xl bg-surface-2 ring-2 ring-transparent transition',
                    'hover:ring-brand-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                    selected && 'ring-brand-500',
                    used && 'cursor-not-allowed opacity-40',
                  )}
                >
                  <ProductImage path={path} alt={path.split('/').pop() ?? ''} sizes="160px" />
                  {(selected || used) && (
                    <span className="absolute top-1.5 right-1.5 inline-flex size-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white shadow">
                      {used ? <Check className="size-3.5" aria-hidden /> : order + 1}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {filtered.length > limit && (
        <div className="mt-5 flex justify-center">
          <Button variant="outline" size="sm" className="max-sm:h-11 max-sm:w-full" onClick={() => setLimit((l) => l + PAGE)}>
            Carregar mais ({filtered.length - limit})
          </Button>
        </div>
      )}
    </Modal>
  )
}
