import { ArrowLeft, PackageX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigationType, useParams } from 'react-router'
import { Breadcrumbs, type BreadcrumbItem } from '@/components/catalog/breadcrumbs'
import { ImageLightbox } from '@/components/catalog/image-lightbox'
import { ProductActions, ProductDetails, ProductDetailsSkeleton } from '@/components/catalog/product-details'
import { ProductGallery, ProductGallerySkeleton } from '@/components/catalog/product-gallery'
import { RelatedProducts } from '@/components/catalog/related-products'
import { buttonVariants } from '@/components/ui/button-variants'
import { EmptyState } from '@/components/ui/feedback'
import { useCatalogLookups, useProduct } from '@/hooks/catalog'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { catalogHref } from '@/lib/catalog-params'
import type { Product } from '@/types/catalog'

/** largura real da imagem principal; limitada à versão 800w (o original fica para o zoom) */
const MAIN_IMAGE_SIZES = '(min-width: 1280px) 600px, (min-width: 1024px) 46vw, 90vw'

export default function ProductPage() {
  const { id } = useParams()
  const { data, isLoading, isError } = useProduct(id)
  const product = data && data.status === 'active' ? data : null

  useDocumentTitle(product ? product.name : isLoading ? null : 'Produto não encontrado')
  useScrollTopOnChange(id)

  if (isLoading) return <ProductPageSkeleton />
  if (!product) return <ProductNotFound failed={isError} />
  return <ProductView key={product.id} product={product} />
}

/** Ao trocar de produto (navegação nova), volta ao topo; "voltar/avançar" mantém a posição restaurada. */
function useScrollTopOnChange(id: string | undefined) {
  const navigationType = useNavigationType()
  const navigationTypeRef = useRef(navigationType)
  useEffect(() => {
    navigationTypeRef.current = navigationType
  })
  useEffect(() => {
    if (navigationTypeRef.current === 'POP') return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [id])
}

function ProductView({ product }: { product: Product }) {
  const { categoryById } = useCatalogLookups()
  const category = categoryById.get(product.category)
  const [size, setSize] = useState<string | null>(null)
  const [imageIndex, setImageIndex] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)

  const crumbs: BreadcrumbItem[] = [{ label: 'Início', to: '/' }]
  crumbs.push(
    category
      ? { label: category.name, to: catalogHref({ categories: [category.id] }) }
      : { label: 'Catálogo', to: '/catalogo' },
  )
  crumbs.push({ label: product.name })

  return (
    <div className="container-page pt-6 pb-20 sm:pt-8 lg:pb-28">
      <Breadcrumbs items={crumbs} />

      <div className="mt-6 grid gap-8 sm:mt-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
        <ProductGallery
          images={product.images}
          name={product.name}
          variant="page"
          sizes={MAIN_IMAGE_SIZES}
          priority
          index={imageIndex}
          onIndexChange={setImageIndex}
          onOpenViewer={(index) => {
            setImageIndex(index)
            setViewerOpen(true)
          }}
        />

        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductDetails
            product={product}
            variant="page"
            size={size}
            onSizeChange={setSize}
            actions={<ProductActions product={product} size={size} variant="page" />}
          />
        </div>
      </div>

      <RelatedProducts product={product} className="mt-20 sm:mt-28" />

      <ImageLightbox
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        images={product.images}
        name={product.name}
        index={imageIndex}
        onIndexChange={setImageIndex}
      />
    </div>
  )
}

function ProductPageSkeleton() {
  return (
    <div className="container-page pt-6 pb-20 sm:pt-8" role="status" aria-label="Carregando produto">
      <div className="skeleton h-3 w-48 rounded-full" aria-hidden />
      <div className="mt-6 grid gap-8 sm:mt-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
        <ProductGallerySkeleton variant="page" />
        <ProductDetailsSkeleton />
      </div>
    </div>
  )
}

function ProductNotFound({ failed }: { failed: boolean }) {
  return (
    <div className="container-page pt-6 pb-24 sm:pt-8">
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Catálogo', to: '/catalogo' }, { label: 'Produto' }]} />
      <EmptyState
        className="mt-10 rounded-3xl border border-dashed border-line-strong bg-surface/60 py-20"
        icon={<PackageX className="size-7" aria-hidden />}
        title={failed ? 'Não foi possível carregar o produto' : 'Produto não encontrado'}
        description={
          failed
            ? 'Algo deu errado ao abrir este produto. Tente novamente em instantes.'
            : 'Este produto não existe ou não está mais disponível na vitrine. Veja as novidades do catálogo.'
        }
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/" className={buttonVariants({ variant: 'outline' })}>
              <ArrowLeft aria-hidden />
              Início
            </Link>
            <Link to="/catalogo" className={buttonVariants({ variant: 'primary' })}>
              Ver catálogo
            </Link>
          </div>
        }
      />
    </div>
  )
}
