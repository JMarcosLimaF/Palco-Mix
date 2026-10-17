import { ChevronLeft, PackageX } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ProductForm } from '@/components/admin/products/product-form'
import { ProductFormSkeleton } from '@/components/admin/products/product-form-skeleton'
import { Panel } from '@/components/admin/ui'
import { buttonVariants } from '@/components/ui/button-variants'
import { EmptyState } from '@/components/ui/feedback'
import { useProduct } from '@/hooks/catalog'
import { useDocumentTitle } from '@/hooks/use-document-title'

/** /admin/produtos/novo e /admin/produtos/:id */
export default function ProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { data: product, isLoading } = useProduct(id)
  // "Salvar e criar outro" remonta o formulário limpo
  const [formKey, setFormKey] = useState(0)
  // após excluir, evita piscar "não encontrado" enquanto volta para a lista
  const [leaving, setLeaving] = useState(false)
  const reduceMotion = useReducedMotion()

  useDocumentTitle(
    isEdit ? (product ? `Editar ${product.name} · Admin` : 'Editar produto · Admin') : 'Novo produto · Admin',
  )

  if (leaving || (isEdit && isLoading)) return <ProductFormSkeleton />

  if (isEdit && !product) {
    return (
      <Panel>
        <EmptyState
          icon={<PackageX className="size-7" aria-hidden />}
          title="Produto não encontrado"
          description="Ele pode ter sido excluído ou o link está incorreto."
          action={
            <Link to="/admin/produtos" className={buttonVariants({ variant: 'outline' })}>
              <ChevronLeft aria-hidden />
              Voltar para produtos
            </Link>
          }
        />
      </Panel>
    )
  }

  return (
    <ProductForm
      key={`${id ?? 'novo'}:${formKey}`}
      product={product ?? null}
      onCreateAnother={() => {
        setFormKey((k) => k + 1)
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
      }}
      onDeleted={() => setLeaving(true)}
    />
  )
}
