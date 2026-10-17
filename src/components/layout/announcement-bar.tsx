import { InstagramIcon, WhatsAppIcon } from '@/components/brand/social-icons'
import { site, whatsappLink } from '@/config/site'
import { CONTACT_MESSAGE } from './nav-config'

/** Faixa fina de avisos acima do cabeçalho (escura nos dois temas). */
export function AnnouncementBar() {
  return (
    <div className="border-b border-white/[0.06] bg-ink-950 text-white">
      <div className="container-page flex h-9 items-center justify-center gap-4 text-xs">
        <a
          href={whatsappLink(CONTACT_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex min-w-0 items-center gap-2 text-white/80 transition-colors hover:text-white"
        >
          <WhatsAppIcon className="size-3.5 shrink-0 text-[#25D366]" aria-hidden />
          <span className="truncate">Atendimento e pedidos pelo WhatsApp</span>
          <span className="hidden font-semibold text-white tabular-nums underline-offset-4 group-hover:underline sm:inline">
            {site.whatsapp.display}
          </span>
          <span className="sr-only">(abre em nova aba)</span>
        </a>
        <span aria-hidden className="hidden h-3 w-px bg-white/20 sm:block" />
        <a
          href={site.instagram.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 text-white/70 transition-colors hover:text-white sm:inline-flex"
        >
          <InstagramIcon className="size-3.5" aria-hidden />@{site.instagram.handle}
          <span className="sr-only">no Instagram (abre em nova aba)</span>
        </a>
      </div>
    </div>
  )
}
