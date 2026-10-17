import { AnimatePresence, m } from 'motion/react'
import { WhatsAppIcon } from '@/components/brand/social-icons'
import { buttonVariants } from '@/components/ui/button-variants'
import { site, whatsappLink } from '@/config/site'
import { cn, effectivePrice, formatBRL, hasPromo, isPriceOnRequest } from '@/lib/utils'
import type { Product } from '@/types/catalog'
import { productWhatsappMessage } from './catalog-helpers'
import { useFooterInView } from './use-footer-in-view'

const EASE = [0.16, 1, 0.3, 1] as const

export interface ProductBuyBarProps {
  product: Product
  /** numeração escolhida (vai na mensagem) */
  size: string | null
}

/**
 * Barra fixa de compra da página do produto no celular (< md): preço + "Pedir
 * pelo WhatsApp" sempre na zona do polegar. Respeita a área segura do iPhone e
 * sai do caminho quando o rodapé aparece (ele tem o próprio CTA).
 */
export function ProductBuyBar({ product, size }: ProductBuyBarProps) {
  const footerInView = useFooterInView()
  const showPrice = site.showPrices
  // sem preços na loja, o botão é sempre "Pedir pelo WhatsApp"
  const onRequest = showPrice && isPriceOnRequest(product)
  const cash = hasPromo(product)
  const href = whatsappLink(productWhatsappMessage(product, size))

  return (
    <AnimatePresence initial={false}>
      {!footerInView && (
        <m.aside
          key="buy-bar"
          aria-label="Pedido rápido"
          initial={{ y: '110%' }}
          animate={{ y: 0, transition: { duration: 0.35, ease: EASE } }}
          exit={{ y: '110%', transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
          className={cn(
            'fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-elevated/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-fg md:hidden',
            'shadow-[0_-10px_30px_-24px_rgb(13_13_13/0.5)] backdrop-blur-xl backdrop-saturate-150 dark:shadow-[0_-10px_30px_-20px_rgb(0_0_0/0.9)]',
          )}
        >
          <div className="mx-auto flex max-w-lg items-center gap-2.5 min-[380px]:gap-3">
            <div className="min-w-0 flex-1 leading-tight">
              {!showPrice ? (
                <>
                  <p className="truncate text-sm font-bold tracking-tight">{product.name}</p>
                  <p className="mt-0.5 text-xs text-muted">Atendimento pelo WhatsApp</p>
                </>
              ) : onRequest ? (
                <>
                  <p className="text-base font-bold tracking-tight">Sob consulta</p>
                  <p className="mt-0.5 text-xs text-muted">Preço pelo WhatsApp</p>
                </>
              ) : (
                <>
                  {/* preços longos: o "à vista" desce para a linha de baixo em vez de ser cortado */}
                  <p className="flex flex-wrap items-baseline gap-x-1 text-lg font-extrabold tracking-tight tabular-nums">
                    <span>
                      <span className="sr-only">{cash ? 'Preço à vista: ' : 'Preço: '}</span>
                      {formatBRL(effectivePrice(product))}
                    </span>
                    {cash && (
                      <span className="text-xs font-semibold tracking-normal text-muted" aria-hidden>
                        à vista
                      </span>
                    )}
                  </p>
                  {cash && (
                    <p className="mt-0.5 truncate text-xs text-subtle tabular-nums">
                      <span className="sr-only">Preço a prazo: </span>
                      {formatBRL(product.price)}
                      <span className="ml-1 font-semibold" aria-hidden>
                        a prazo
                      </span>
                    </p>
                  )}
                </>
              )}
            </div>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'whatsapp', size: 'md', className: 'h-12 px-4 min-[380px]:px-5' })}
            >
              <WhatsAppIcon className="size-5" />
              {onRequest ? (
                <span>
                  Consultar preço<span className="sr-only"> no WhatsApp</span>
                </span>
              ) : (
                <span>
                  Pedir <span className="max-[359px]:hidden">pelo </span>WhatsApp
                </span>
              )}
            </a>
          </div>
        </m.aside>
      )}
    </AnimatePresence>
  )
}
