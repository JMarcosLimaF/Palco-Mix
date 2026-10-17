import { useFeaturedProducts, useProductQuery } from '@/hooks/catalog'
import { catalogHref } from '@/lib/catalog-params'
import type { ProductQuery } from '@/types/catalog'
import { ProductRail } from './product-rail'
import { Reveal } from './reveal'
import { SectionHeader } from './section-header'

const OFFERS_QUERY: ProductQuery = { onSale: true, sort: 'price-asc', pageSize: 12 }

/** "Em destaque": vitrine horizontal dos produtos marcados como destaque. */
export function FeaturedSection() {
  const featured = useFeaturedProducts(12)
  if (!featured.isPending && !featured.data?.length) return null

  return (
    <section aria-labelledby="home-destaques" className="container-page pt-16 sm:pt-24">
      <Reveal>
        <SectionHeader
          id="home-destaques"
          eyebrow="Em destaque"
          title="Brilhando no palco"
          description="A seleção especial da vitrine. Toque em uma peça para ver os detalhes."
          action={{ to: catalogHref({ featured: true }), label: 'Ver todos', ariaLabel: 'Ver todos os destaques' }}
        />
      </Reveal>
      <Reveal className="mt-8 sm:mt-10" delay={0.05}>
        <ProductRail products={featured.data} loading={featured.isPending} label="Produtos em destaque" />
      </Reveal>
    </section>
  )
}

/** "Ofertas": só aparece quando há produtos com preço promocional. */
export function OffersSection() {
  const offers = useProductQuery(OFFERS_QUERY)
  const items = offers.data?.items
  // seção opcional: some enquanto carrega para não "piscar" um esqueleto à toa
  if (!items?.length) return null

  return (
    <section aria-labelledby="home-ofertas" className="container-page pt-16 sm:pt-24">
      <Reveal>
        <SectionHeader
          id="home-ofertas"
          eyebrow="Ofertas"
          title="Preço especial"
          description="Produtos com preço promocional no catálogo, do menor para o maior."
          action={{ to: catalogHref({ onSale: true }), label: 'Ver todas', ariaLabel: 'Ver todas as ofertas' }}
        />
      </Reveal>
      <Reveal className="mt-8 sm:mt-10" delay={0.05}>
        <ProductRail products={items} label="Produtos em oferta" />
      </Reveal>
    </section>
  )
}
