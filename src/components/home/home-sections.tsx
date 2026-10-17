/**
 * Tudo o que fica abaixo do hero. Carregado sob demanda pela HomePage
 * (React.lazy) para a primeira dobra chegar mais rápido.
 */
import { BrandMarquee } from './brand-marquee'
import { CategoryShowcase } from './category-showcase'
import { LatestProducts } from './latest-products'
import { FeaturedSection, OffersSection } from './rail-sections'
import { ValueStrip } from './value-strip'
import { WhatsAppCta } from './whatsapp-cta'

export default function HomeSections() {
  return (
    <div className="pb-16 sm:pb-24">
      <ValueStrip />
      <CategoryShowcase />
      <FeaturedSection />
      <BrandMarquee />
      <LatestProducts />
      <OffersSection />
      <WhatsAppCta />
    </div>
  )
}
