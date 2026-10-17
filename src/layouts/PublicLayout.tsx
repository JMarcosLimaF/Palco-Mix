import { useEffect, useRef, type MouseEvent } from 'react'
import { Outlet, useLocation } from 'react-router'
import { QuickViewHost } from '@/components/catalog/quick-view'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { useMobileTabBarVisible } from '@/components/layout/use-mobile-tab-bar-visible'
import { WhatsAppFab } from '@/components/layout/whatsapp-fab'
import { cn } from '@/lib/utils'

/** Leva o foco ao conteúdo sem sujar a URL com "#conteudo". */
function skipToContent(event: MouseEvent<HTMLAnchorElement>) {
  const main = document.getElementById('conteudo')
  if (!main) return
  event.preventDefault()
  main.focus({ preventScroll: true })
  main.scrollIntoView({ block: 'start' })
}

/** Espera a página nova definir o <title> (useDocumentTitle) antes de anunciá-lo. */
const ANNOUNCE_DELAY = 250

/**
 * Troca de página (pathname): leva o foco ao <main> (sem rolar — o ScrollRestoration
 * cuida da posição) e anuncia o título novo. Filtros e ?p= (só a busca muda) não contam.
 */
function useRouteAnnouncer() {
  const { pathname } = useLocation()
  const previousRef = useRef(pathname)
  const regionRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (previousRef.current === pathname) return
    previousRef.current = pathname
    document.getElementById('conteudo')?.focus({ preventScroll: true })
    const region = regionRef.current
    if (!region) return
    region.textContent = ''
    const timer = window.setTimeout(() => {
      region.textContent = document.title
    }, ANNOUNCE_DELAY)
    return () => window.clearTimeout(timer)
  }, [pathname])

  return regionRef
}

/**
 * Espaço da barra inferior do celular (< md): o rodapé termina acima dela.
 * `--mobile-tabbar-h` fica disponível para camadas fixas das páginas
 * (ex.: `bottom-[calc(1rem+var(--mobile-tabbar-h,0px))]`).
 */
const TAB_BAR_SPACE =
  '[--mobile-tabbar-h:calc(4rem+env(safe-area-inset-bottom))] md:[--mobile-tabbar-h:0px] pb-(--mobile-tabbar-h)'

/** Casca da vitrine pública: avisos, cabeçalho, conteúdo, rodapé e camadas flutuantes. */
export function PublicLayout() {
  const announcerRef = useRouteAnnouncer()
  const tabBarVisible = useMobileTabBarVisible()
  return (
    <div className={cn('flex min-h-dvh flex-col bg-bg text-fg', tabBarVisible && TAB_BAR_SPACE)}>
      <a
        href="#conteudo"
        onClick={skipToContent}
        className="sr-only rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-glow focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
      >
        Pular para o conteúdo
      </a>
      <AnnouncementBar />
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      <QuickViewHost />
      <WhatsAppFab />
      <p ref={announcerRef} className="sr-only" role="status" aria-live="polite" aria-atomic="true" />
    </div>
  )
}
