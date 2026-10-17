import { ChevronDown, EyeOff, ScanEye } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useDeferredValue, useId, useMemo, useState } from 'react'
import { Panel } from '@/components/admin/ui'
import { ProductCard } from '@/components/catalog/product-card'
import { cn } from '@/lib/utils'
import { isValidPrice, parsePrice } from './parse-price'
import { buildPreviewProduct, type ProductFormValues } from './product-form-model'

export interface ProductPreviewProps {
  values: ProductFormValues
  /** id/data de criação do produto (ou provisórios, no cadastro) */
  base: { id: string; createdAt: string }
  categoryName?: string
  distributorName?: string
  /** no celular a prévia começa recolhida */
  collapsible?: boolean
}

const EASE = [0.16, 1, 0.3, 1] as const

/** Prévia ao vivo do card exatamente como aparece na vitrine. */
export function ProductPreview({ values, base, categoryName, distributorName, collapsible = false }: ProductPreviewProps) {
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  // digitação fluida: a prévia acompanha com prioridade baixa
  const deferred = useDeferredValue(values)
  const product = useMemo(() => buildPreviewProduct(deferred, base), [deferred, base])
  const expanded = !collapsible || open
  const inactive = values.status === 'inactive'
  const missingPrice = !values.priceOnRequest && !isValidPrice(parsePrice(values.price))

  const body = (
    <div className="p-5 pt-4">
      <div className="mx-auto w-full max-w-[17rem]">
        {/* inert: o card não abre a visualização rápida nem recebe foco aqui */}
        <div inert className="pointer-events-none select-none">
          <ProductCard
            product={product}
            categoryName={categoryName}
            distributorName={distributorName}
            sizes="272px"
            className={cn('transition-opacity duration-300', inactive && 'opacity-50 grayscale-[35%]')}
          />
        </div>
      </div>
      {inactive && (
        <p className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-surface-2 px-3 py-2 text-xs font-medium text-muted">
          <EyeOff className="size-3.5" aria-hidden />
          Inativo: não aparece na loja
        </p>
      )}
      {missingPrice && (
        <p className="mt-3 text-center text-xs text-subtle">Sem preço informado, o card mostra “Sob consulta”.</p>
      )}
    </div>
  )

  return (
    <Panel className="overflow-hidden">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-surface/70"
        >
          <span className="flex items-center gap-2.5">
            <ScanEye className="size-[1.1rem] text-brand-500" aria-hidden />
            <span>
              <span className="block text-base font-bold tracking-tight text-fg">Prévia na loja</span>
              <span className="block text-xs text-muted">Como o card aparece na vitrine</span>
            </span>
          </span>
          <ChevronDown
            className={cn('size-5 text-subtle transition-transform duration-300 ease-out-expo', open && 'rotate-180')}
            aria-hidden
          />
        </button>
      ) : (
        <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
          <ScanEye className="size-[1.1rem] text-brand-500" aria-hidden />
          <div>
            <h2 className="text-base font-bold tracking-tight text-fg">Prévia na loja</h2>
            <p className="mt-0.5 text-xs text-muted">Atualiza enquanto você edita</p>
          </div>
        </div>
      )}

      {collapsible ? (
        <AnimatePresence initial={false}>
          {expanded && (
            <m.div
              id={bodyId}
              key="preview-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1, transition: { duration: 0.35, ease: EASE } }}
              exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
              className="overflow-hidden border-t border-line"
            >
              {body}
            </m.div>
          )}
        </AnimatePresence>
      ) : (
        <div className="bg-surface/40">{body}</div>
      )}
    </Panel>
  )
}
