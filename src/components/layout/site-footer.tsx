import { ArrowUp, LockKeyhole } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { LogoBadge, LogoMark } from '@/components/brand/logo'
import { InstagramIcon, WhatsAppIcon } from '@/components/brand/social-icons'
import { buttonVariants } from '@/components/ui/button-variants'
import { site, whatsappLink } from '@/config/site'
import { catalogHref } from '@/lib/catalog-params'
import { cn } from '@/lib/utils'
import { CONTACT_MESSAGE, NAV_ITEMS, PRIMARY_NAV, UNDERLINE_LINK } from './nav-config'
import { useNavTaxonomy } from './use-nav-taxonomy'

const FOOTER_CATEGORY_LIMIT = 6
const LINK = cn('text-sm text-white/65 hover:text-white', UNDERLINE_LINK)

function scrollToTop() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
}

/** Rodapé escuro (igual nos dois temas) com navegação, categorias e atendimento. */
export function SiteFooter() {
  const { topCategories, isLoading } = useNavTaxonomy()
  const categories = topCategories.slice(0, FOOTER_CATEGORY_LIMIT)
  const year = new Date().getFullYear()

  return (
    <footer className="relative isolate overflow-hidden border-t border-white/[0.06] bg-ink-950 text-white">
      {/* brilho azul sutil + símbolo em marca d'água */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(56rem_28rem_at_88%_-12%,rgb(0_102_255/0.2),transparent_62%),radial-gradient(40rem_22rem_at_-8%_110%,rgb(0_102_255/0.1),transparent_60%)]"
      />
      <LogoMark className="pointer-events-none absolute -right-20 -bottom-16 -z-10 h-[22rem] text-white opacity-[0.035] sm:h-[28rem]" />

      <div className="container-page pt-16 pb-8 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,2fr)] lg:gap-16">
          <div className="max-w-sm">
            <Link to="/" className="inline-block rounded-full transition-transform duration-500 ease-out-expo hover:scale-[1.03]">
              <LogoBadge size={88} className="size-[5.5rem]" />
            </Link>
            <p className="mt-6 text-sm leading-relaxed text-white/65">{site.description}</p>
            <a
              href={whatsappLink(CONTACT_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'whatsapp', size: 'md', className: 'mt-6' })}
            >
              <WhatsAppIcon aria-hidden />
              Peça pelo WhatsApp
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
            <FooterColumn title="Navegação">
              {PRIMARY_NAV.map((key) => (
                <li key={key}>
                  <Link to={NAV_ITEMS[key].href} className={LINK}>
                    {NAV_ITEMS[key].label}
                  </Link>
                </li>
              ))}
            </FooterColumn>

            <FooterColumn title="Categorias">
              {isLoading
                ? [0, 1, 2, 3].map((i) => (
                    <li key={i} aria-hidden>
                      <span className="block h-3 w-20 rounded-full bg-white/10" />
                    </li>
                  ))
                : categories.map(({ item }) => (
                    <li key={item.id}>
                      <Link to={catalogHref({ categories: [item.id] })} className={LINK}>
                        {item.name}
                      </Link>
                    </li>
                  ))}
              <li>
                <Link
                  to="/categorias"
                  className={cn('inline-flex items-center gap-1 text-sm font-semibold text-brand-300 hover:text-brand-200', UNDERLINE_LINK)}
                >
                  Ver todas
                </Link>
              </li>
            </FooterColumn>

            <FooterColumn title="Atendimento" className="col-span-2 sm:col-span-1">
              <li>
                <a
                  href={whatsappLink(CONTACT_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-start gap-3"
                >
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[#25D366] ring-1 ring-white/10 transition-colors group-hover:bg-[#25D366] group-hover:text-white">
                    <WhatsAppIcon className="size-[1.1rem]" aria-hidden />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-xs text-white/55">WhatsApp</span>
                    <span className={cn('text-sm font-semibold text-white/85 tabular-nums group-hover:text-white', UNDERLINE_LINK, 'group-hover:bg-[length:100%_1px]')}>
                      {site.whatsapp.display}
                    </span>
                  </span>
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              </li>
              <li>
                <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-start gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/85 ring-1 ring-white/10 transition-colors group-hover:bg-white group-hover:text-ink-950">
                    <InstagramIcon className="size-[1.05rem]" aria-hidden />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-xs text-white/55">Instagram</span>
                    <span className={cn('text-sm font-semibold text-white/85 group-hover:text-white', UNDERLINE_LINK, 'group-hover:bg-[length:100%_1px]')}>
                      @{site.instagram.handle}
                    </span>
                  </span>
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              </li>
              <li className="pt-1">
                <Link to="/admin" className={cn('inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white', UNDERLINE_LINK)}>
                  <LockKeyhole className="size-3.5" aria-hidden />
                  Área administrativa
                </Link>
              </li>
            </FooterColumn>
          </div>
        </div>

        <div className="mt-14 sm:mt-16">
          <div aria-hidden className="logo-stripe h-[2px] w-full rounded-full opacity-80" />
          <div className="flex flex-col-reverse gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-white/50">
              © {year} {site.fullName}. Todos os direitos reservados.
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              className="group inline-flex h-10 items-center gap-2 self-start rounded-full bg-white/[0.06] px-4 text-xs font-semibold text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white hover:text-ink-950 sm:self-auto"
            >
              Voltar ao topo
              <ArrowUp className="size-3.5 transition-transform duration-300 ease-out-expo group-hover:-translate-y-0.5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <h2 className="eyebrow text-white/55">{title}</h2>
      <ul className="mt-5 flex flex-col items-start gap-3">{children}</ul>
    </div>
  )
}
