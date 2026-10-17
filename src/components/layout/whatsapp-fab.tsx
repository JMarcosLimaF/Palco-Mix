import { AnimatePresence, m } from 'motion/react'
import { useEffect, useState } from 'react'
import { WhatsAppIcon } from '@/components/brand/social-icons'
import { whatsappLink } from '@/config/site'
import { CONTACT_MESSAGE } from './nav-config'
import { useScrolledPast } from './use-scrolled-past'

const EASE = [0.16, 1, 0.3, 1] as const

/** true enquanto o rodapé da página está visível (ele já tem o próprio CTA de WhatsApp). */
function useFooterInView() {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const footer = document.querySelector('footer')
    if (!footer || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '0px 0px -40px 0px' })
    io.observe(footer)
    return () => io.disconnect()
  }, [])
  return inView
}

/**
 * Botão flutuante de WhatsApp (md+): surge após rolar 300px e some sobre o rodapé
 * (que tem CTA próprio e o "Voltar ao topo"); fica abaixo de modais (z-30).
 * No celular não aparece: a barra inferior já tem o WhatsApp.
 */
export function WhatsAppFab() {
  const scrolled = useScrolledPast(300)
  const footerInView = useFooterInView()
  const visible = scrolled && !footerInView

  return (
    <AnimatePresence>
      {visible && (
        <m.a
          key="whatsapp-fab"
          href={whatsappLink(CONTACT_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Fale com a Palco Mix pelo WhatsApp (abre em nova aba)"
          initial={{ opacity: 0, scale: 0.6, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: EASE } }}
          exit={{ opacity: 0, scale: 0.7, y: 12, transition: { duration: 0.2 } }}
          className="group fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 hidden size-14 md:inline-flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_14px_34px_-10px_rgb(37_211_102/0.75)] transition-[box-shadow,background-color] duration-300 hover:bg-[#1fc15c] hover:shadow-[0_18px_40px_-10px_rgb(37_211_102/0.9)] sm:right-6 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
        >
          {/* anel pulsante (CSS); some com "reduzir movimento" */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-35 [animation-duration:2.8s] motion-reduce:hidden"
          />
          <WhatsAppIcon className="relative size-7 transition-transform duration-300 ease-out-expo group-hover:scale-110" />
          {/* rótulo no hover/foco (desktop) */}
          <span
            aria-hidden
            className="pointer-events-none absolute right-full mr-3 hidden translate-x-1 rounded-full bg-ink-950 px-3.5 py-2 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-pop ring-1 ring-white/10 transition-[opacity,translate] duration-300 ease-out-expo group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 md:block"
          >
            Fale com a gente
          </span>
        </m.a>
      )}
    </AnimatePresence>
  )
}
