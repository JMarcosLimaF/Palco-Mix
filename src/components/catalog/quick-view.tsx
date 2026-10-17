import { PackageX } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { EmptyState } from '@/components/ui/feedback'
import { Modal } from '@/components/ui/modal'
import { useProduct } from '@/hooks/catalog'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useQuickView } from '@/hooks/use-quick-view'
import type { Product } from '@/types/catalog'
import { ProductActions, ProductDetails, ProductDetailsSkeleton } from './product-details'
import { ProductGallery, ProductGallerySkeleton } from './product-gallery'

/**
 * A imagem principal cabe na altura do modal (máx. min(90dvh, 56rem)) sem
 * distorcer a proporção 5:6: largura = min(100%, altura-alvo × 5/6).
 * Celular (bottom sheet): no máx. ~42% da altura da tela, para nome, preço e o
 * CTA fixo aparecerem já na primeira tela.
 */
const FRAME_SM_UP = 'sm:w-[min(100%,calc(min(58dvh,34rem)*5/6))] md:w-[min(100%,calc(min(64dvh,40rem)*5/6))]'
const FRAME_CLASS = `mx-auto w-[min(100%,calc(min(42dvh,24rem)*5/6))] ${FRAME_SM_UP}`
/**
 * Com miniaturas em coluna ao lado (celular, 2+ imagens): largura relativa à
 * tela (e não ao pai, que encolhe para caber a coluna) — 6rem = respiro + coluna.
 */
const FRAME_WITH_THUMBS_CLASS = `mx-auto w-[min(calc(100vw-6rem),calc(min(42dvh,24rem)*5/6))] ${FRAME_SM_UP}`
/** largura real da imagem principal (a galeria limita o srcset a 800w) */
const MAIN_IMAGE_SIZES = '(min-width: 768px) 480px, (min-width: 640px) 90vw, 75vw'

/**
 * Visualização Rápida (?p=<id>). Montada uma vez no PublicLayout: qualquer
 * ProductCard de qualquer página pública abre este modal.
 */
export function QuickViewHost() {
  const { productId, close } = useQuickView()
  // mantém o último produto durante a animação de saída (o ?p= já saiu da URL)
  const [lastId, setLastId] = useState(productId)
  if (productId !== null && productId !== lastId) setLastId(productId)
  const displayId = productId ?? lastId
  const open = productId !== null

  const { data, isLoading, isError } = useProduct(displayId ?? undefined)
  const product = data && data.status === 'active' ? data : null

  // numeração escolhida, por produto (trocar de produto zera a escolha)
  const [choice, setChoice] = useState<{ id: string | null; size: string | null }>({ id: null, size: null })
  const size = choice.id === displayId ? choice.size : null
  const setSize = useCallback((next: string | null) => setChoice({ id: displayId, size: next }), [displayId])

  // < md: layout empilhado (bottom sheet) com o CTA fixo no rodapé
  const twoColumns = useMediaQuery('(min-width: 768px)')

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
      }}
      title={product?.name ?? 'Visualização rápida'}
      description={product ? 'Visualização rápida do produto' : undefined}
      size="2xl"
      hideHeader
      bodyClassName="p-0 sm:p-0"
      footer={
        product && !twoColumns ? <ProductActions product={product} size={size} variant="modal" layout="bar" /> : undefined
      }
    >
      {isLoading ? (
        <QuickViewSkeleton />
      ) : product ? (
        <QuickViewContent
          key={product.id}
          product={product}
          size={size}
          onSizeChange={setSize}
          showActions={twoColumns}
        />
      ) : displayId ? (
        <EmptyState
          className="py-14 sm:py-20"
          icon={<PackageX className="size-7" aria-hidden />}
          title={isError ? 'Não foi possível carregar o produto' : 'Produto indisponível'}
          description={
            isError
              ? 'Tente novamente em instantes.'
              : 'Este produto não está mais disponível na vitrine. Que tal ver as outras novidades?'
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={close}>
                Fechar
              </Button>
              <Link to="/catalogo" replace className={buttonVariants({ variant: 'primary' })}>
                Ver catálogo
              </Link>
            </div>
          }
        />
      ) : null}
    </Modal>
  )
}

interface QuickViewContentProps {
  product: Product
  size: string | null
  onSizeChange: (size: string | null) => void
  showActions: boolean
}

function QuickViewContent({ product, size, onSizeChange, showActions }: QuickViewContentProps) {
  return (
    <div className="md:grid md:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
      <div className="bg-surface md:border-r md:border-line">
        <div className="px-4 pt-3 pb-4 sm:p-6 md:sticky md:top-0">
          <ProductGallery
            images={product.images}
            name={product.name}
            variant="modal"
            sizes={MAIN_IMAGE_SIZES}
            priority
            frameClassName={product.images.length > 1 ? FRAME_WITH_THUMBS_CLASS : FRAME_CLASS}
          />
        </div>
      </div>
      <div className="px-5 pt-4 pb-6 sm:px-6 sm:pt-5 sm:pb-8 md:px-8 md:pt-10 md:pb-8 lg:px-10">
        <ProductDetails
          product={product}
          variant="modal"
          size={size}
          onSizeChange={onSizeChange}
          actions={showActions ? <ProductActions product={product} size={size} variant="modal" /> : undefined}
        />
      </div>
    </div>
  )
}

function QuickViewSkeleton() {
  return (
    <div className="md:grid md:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]" role="status" aria-label="Carregando produto">
      <div className="bg-surface px-4 pt-3 pb-4 sm:p-6 md:border-r md:border-line">
        <ProductGallerySkeleton variant="modal" frameClassName={FRAME_CLASS} />
      </div>
      <div className="px-5 pt-4 pb-6 sm:px-6 sm:pt-5 sm:pb-8 md:px-8 md:pt-10 lg:px-10">
        <ProductDetailsSkeleton />
      </div>
    </div>
  )
}
