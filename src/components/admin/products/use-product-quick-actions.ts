import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { usePatchProduct } from '@/hooks/catalog'
import { errorMessage } from '@/services/errors'
import type { Product } from '@/types/catalog'

export type QuickActionKind = 'status' | 'featured'

export interface ProductQuickActions {
  toggleStatus: (product: Product) => Promise<void>
  toggleFeatured: (product: Product) => Promise<void>
  isPending: (id: string, kind: QuickActionKind) => boolean
}

/**
 * Alternâncias rápidas da tabela (ativo/inativo e destaque) com toast + "Desfazer".
 * Acompanha o carregamento por linha, permitindo cliques em várias linhas ao mesmo tempo.
 */
export function useProductQuickActions(): ProductQuickActions {
  const { mutateAsync } = usePatchProduct()
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set())

  const run = useCallback(async (key: string, task: () => Promise<void>) => {
    setPending((prev) => new Set(prev).add(key))
    try {
      await task()
    } finally {
      setPending((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }, [])

  const undo = useCallback(
    (id: string, patch: Partial<Pick<Product, 'status' | 'isFeatured'>>) => {
      mutateAsync({ id, patch }).catch((err: unknown) => toast.error(errorMessage(err)))
    },
    [mutateAsync],
  )

  const toggleStatus = useCallback(
    (product: Product) =>
      run(`${product.id}:status`, async () => {
        const next = product.status === 'active' ? 'inactive' : 'active'
        try {
          await mutateAsync({ id: product.id, patch: { status: next } })
          toast.success(next === 'active' ? 'Produto ativado' : 'Produto inativado', {
            description:
              next === 'active' ? `${product.name} voltou a aparecer na loja.` : `${product.name} não aparece mais na loja.`,
            action: { label: 'Desfazer', onClick: () => undo(product.id, { status: product.status }) },
          })
        } catch (err) {
          toast.error(errorMessage(err))
        }
      }),
    [mutateAsync, run, undo],
  )

  const toggleFeatured = useCallback(
    (product: Product) =>
      run(`${product.id}:featured`, async () => {
        const next = !product.isFeatured
        try {
          await mutateAsync({ id: product.id, patch: { isFeatured: next } })
          toast.success(next ? 'Adicionado aos destaques' : 'Removido dos destaques', {
            description: product.name,
            action: { label: 'Desfazer', onClick: () => undo(product.id, { isFeatured: product.isFeatured }) },
          })
        } catch (err) {
          toast.error(errorMessage(err))
        }
      }),
    [mutateAsync, run, undo],
  )

  const isPending = useCallback((id: string, kind: QuickActionKind) => pending.has(`${id}:${kind}`), [pending])

  return { toggleStatus, toggleFeatured, isPending }
}
