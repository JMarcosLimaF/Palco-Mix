import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { ImageLibraryDialog } from '@/components/admin/image-library-dialog'
import { ProductImage } from '@/components/catalog/product-image'
import { Button } from '@/components/ui/button'
import type { CategoryExtra } from './forms'
import type { ExtraFieldsProps } from './types'

/** Campo "Imagem de capa" do formulário de categoria (biblioteca de /produtos/). */
export function CategoryFields({ values, setValue, disabled }: ExtraFieldsProps<CategoryExtra>) {
  const [libraryOpen, setLibraryOpen] = useState(false)
  const labelId = useId()
  const hintId = useId()
  const image = values.image
  const fileName = image ? image.split('/').pop() : undefined

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={hintId} className="flex flex-col gap-1.5">
      <span id={labelId} className="text-sm font-semibold text-fg">
        Imagem de capa
      </span>

      <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-3 sm:p-3.5">
        <div className="relative aspect-[5/6] w-24 shrink-0 overflow-hidden rounded-xl bg-surface-2 ring-1 ring-line sm:w-28">
          {image ? (
            <ProductImage key={image} path={image} alt="Prévia da capa escolhida" sizes="112px" />
          ) : (
            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              disabled={disabled}
              aria-label="Escolher imagem de capa na biblioteca"
              className="group absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line-strong text-subtle transition-colors duration-200 hover:border-brand-400 hover:bg-brand-500/5 hover:text-brand-500"
            >
              <ImagePlus className="size-6 transition-transform duration-300 ease-out-expo group-hover:scale-110" aria-hidden />
              <span className="text-[0.6875rem] font-semibold">Sem capa</span>
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">{image ? 'Capa selecionada' : 'Nenhuma imagem escolhida'}</p>
          {fileName ? (
            <p className="mt-0.5 truncate font-mono text-[0.6875rem] text-subtle" title={image}>
              {fileName}
            </p>
          ) : null}
          <p id={hintId} className="mt-1 text-xs leading-relaxed text-muted">
            Escolha uma arte da biblioteca de produtos. Ela é exibida inteira, sem cortes.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setLibraryOpen(true)} disabled={disabled}>
              {image ? <RefreshCw aria-hidden /> : <ImagePlus aria-hidden />}
              {image ? 'Trocar' : 'Escolher da biblioteca'}
            </Button>
            {image && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setValue('image', '')}
                disabled={disabled}
                className="text-muted hover:bg-red-500/10 hover:text-danger-500"
              >
                <Trash2 aria-hidden />
                Remover
              </Button>
            )}
          </div>
        </div>
      </div>

      <ImageLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        multiple={false}
        title="Escolher imagem de capa"
        onSelect={(paths) => {
          if (paths[0]) setValue('image', paths[0])
        }}
      />
    </div>
  )
}
