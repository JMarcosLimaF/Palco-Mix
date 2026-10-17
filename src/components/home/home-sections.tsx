/**
 * Tudo o que fica abaixo do hero. Carregado sob demanda pela HomePage
 * (React.lazy) para a primeira dobra chegar mais rápido.
 */
import { site } from '@/config/site'
import { BrandMarquee } from './brand-marquee'
import { CategoryShowcase } from './category-showcase'
import { LatestProducts } from './latest-products'
import { FeaturedSection, OffersSection } from './rail-sections'
import { ValueStrip } from './value-strip'
import { WhatsAppCta } from './whatsapp-cta'

export default function HomeSections() {
  return (
    <div className="pb-12 sm:pb-24">
      <ValueStrip />
      <CategoryShowcase />
      <FeaturedSection />
      <BrandMarquee />
      <LatestProducts />
      {/* a vitrine não mostra preços: sem seção de desconto à vista */}
      {site.showPrices && <OffersSection />}
      <WhatsAppCta />
    </div>
  )
}
