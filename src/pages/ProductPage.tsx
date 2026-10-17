import { ArrowLeft, PackageX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useNavigationType, useParams } from 'react-router'
import { Breadcrumbs, type BreadcrumbItem } from '@/components/catalog/breadcrumbs'
import { ImageLightbox } from '@/components/catalog/image-lightbox'
import { ProductBuyBar } from '@/components/catalog/product-buy-bar'
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
const MAIN_IMAGE_SIZES = '(min-width: 1280px) 600px, (min-width: 1024px) 46vw, (min-width: 640px) 90vw, 100vw'

/**
 * Celular: a barra fixa de compra (ProductBuyBar) ocupa o rodapé da tela —
 * a página reserva esse espaço (com a área segura) para não cobrir conteúdo.
 */
const PAGE_SPACING = 'container-page pt-3 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:pt-8 md:pb-20 lg:pb-28'

/** `location.state` da página: visualizador em tela cheia aberto. */
interface ProductHistoryState {
  viewer?: boolean
}

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
  // o visualizador é uma entrada do histórico (como a Visualização Rápida):
  // o "voltar" do celular fecha a foto em vez de sair da página
  const location = useLocation()
  const navigate = useNavigate()
  const viewerOpen = Boolean((location.state as ProductHistoryState | null)?.viewer)
  // evita um 2º "voltar" (Esc + clique no X) antes de o primeiro concluir
  const closing = useRef(false)
  useEffect(() => {
    closing.current = false
  }, [location.key])

  function openViewer(index: number) {
    setImageIndex(index)
    if (viewerOpen) return
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { preventScrollReset: true, state: { viewer: true } satisfies ProductHistoryState },
    )
  }

  function setViewerOpen(open: boolean) {
    if (open || !viewerOpen || closing.current) return
    closing.current = true
    navigate(-1)
  }

  const crumbs: BreadcrumbItem[] = [{ label: 'Início', to: '/' }]
  crumbs.push(
    category
      ? { label: category.name, to: catalogHref({ categories: [category.id] }) }
      : { label: 'Catálogo', to: '/catalogo' },
  )
  crumbs.push({ label: product.name })

  return (
    <div className={PAGE_SPACING}>
      <Breadcrumbs items={crumbs} />

      <div className="mt-3 grid gap-5 sm:mt-8 sm:gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
        <ProductGallery
          images={product.images}
          name={product.name}
          variant="page"
          sizes={MAIN_IMAGE_SIZES}
          priority
          index={imageIndex}
          onIndexChange={setImageIndex}
          onOpenViewer={openViewer}
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

      <RelatedProducts product={product} className="mt-14 sm:mt-28" />

      <ProductBuyBar product={product} size={size} />

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
    <div className={PAGE_SPACING} role="status" aria-label="Carregando produto">
      <div className="skeleton h-3 w-24 rounded-full sm:w-48" aria-hidden />
      <div className="mt-3 grid gap-5 sm:mt-8 sm:gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
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
