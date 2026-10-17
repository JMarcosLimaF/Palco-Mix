import type { MouseEvent } from 'react'
import { Outlet } from 'react-router'
import { QuickViewHost } from '@/components/catalog/quick-view'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { WhatsAppFab } from '@/components/layout/whatsapp-fab'

/** Leva o foco ao conteúdo sem sujar a URL com "#conteudo". */
function skipToContent(event: MouseEvent<HTMLAnchorElement>) {
  const main = document.getElementById('conteudo')
  if (!main) return
  event.preventDefault()
  main.focus({ preventScroll: true })
  main.scrollIntoView({ block: 'start' })
}

/** Casca da vitrine pública: avisos, cabeçalho, conteúdo, rodapé e camadas flutuantes. */
export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
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
    </div>
  )
}
