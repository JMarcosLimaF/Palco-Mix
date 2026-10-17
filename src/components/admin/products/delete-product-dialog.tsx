import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { pluralize, productCode } from '@/lib/utils'
import type { Product } from '@/types/catalog'
import { ProductThumb } from './product-cells'

export interface DeleteProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** mantido durante a animação de saída */
  product: Product | null
  onConfirm: () => Promise<unknown>
}

/** Confirmação de exclusão de um produto (mostra miniatura + nome). */
export function DeleteProductDialog({ open, onOpenChange, product, onConfirm }: DeleteProductDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Excluir produto?"
      description="Esta ação é irreversível: o produto sai da loja e do painel."
      confirmLabel="Excluir produto"
      onConfirm={onConfirm}
    >
      {product && (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5 pr-4">
          <ProductThumb product={product} className="w-12 rounded-xl" sizes="56px" />
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm leading-snug font-semibold text-fg">{product.name}</p>
            <p className="mt-0.5 text-xs text-subtle tabular-nums">{productCode(product.id)}</p>
          </div>
        </div>
      )}
    </ConfirmDialog>
  )
}

export interface DeleteProductsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  onConfirm: () => Promise<unknown>
}

const PREVIEW_LIMIT = 4

/** Confirmação de exclusão em lote. */
export function DeleteProductsDialog({ open, onOpenChange, products, onConfirm }: DeleteProductsDialogProps) {
  const rest = products.length - PREVIEW_LIMIT
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Excluir ${pluralize(products.length, 'produto', 'produtos')}?`}
      description="Esta ação é irreversível: os produtos selecionados saem da loja e do painel."
      confirmLabel={products.length === 1 ? 'Excluir produto' : `Excluir ${products.length} produtos`}
      onConfirm={onConfirm}
    >
      {products.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {products.slice(0, PREVIEW_LIMIT).map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-2.5 py-2">
              <ProductThumb product={p} className="w-9 rounded-md" sizes="40px" />
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{p.name}</p>
              <span className="shrink-0 text-xs text-subtle tabular-nums">{productCode(p.id)}</span>
            </li>
          ))}
          {rest > 0 && <li className="px-3 py-2 text-xs font-medium text-muted">e mais {pluralize(rest, 'produto', 'produtos')}</li>}
        </ul>
      )}
    </ConfirmDialog>
  )
}
