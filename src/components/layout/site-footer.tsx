import { ArrowRight, ArrowUp, ArrowUpRight, LockKeyhole } from 'lucide-react'
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
/** Texto curto do celular (no desktop vai a descrição completa). */
const SHORT_DESCRIPTION = 'Calçados e acessórios das marcas que você ama.'
// no celular: linha inteira tocável (44px) e sem o sublinhado animado de hover
const LINK = cn(
  'text-sm text-white/65 hover:text-white',
  UNDERLINE_LINK,
  'max-md:flex max-md:min-h-11 max-md:items-center max-md:bg-none max-md:text-[0.9375rem] max-md:text-white/75',
)

function scrollToTop() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  // o foco acompanha a rolagem: o próximo Tab segue do topo, não do rodapé
  document.getElementById('conteudo')?.focus({ preventScroll: true })
}

/**
 * Rodapé escuro (igual nos dois temas) com navegação, categorias e atendimento.
 * No celular é compacto: marca em uma linha, atendimento logo no começo,
 * navegação em duas colunas e categorias numa faixa com rolagem lateral.
 */
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

      <div className="container-page pt-10 pb-6 md:pt-20 md:pb-8">
        <div className="grid grid-cols-1 gap-8 md:gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,2fr)] lg:gap-16">
          <div className="md:max-w-sm">
            <div className="flex items-center gap-4 md:block">
              <Link
                to="/"
                className="inline-block shrink-0 rounded-full transition-transform duration-500 ease-out-expo hover:scale-[1.03]"
              >
                <LogoBadge size={88} className="size-14 md:size-[5.5rem]" />
              </Link>
              <p className="text-sm leading-relaxed text-white/65 md:mt-6">
                <span className="md:hidden">{SHORT_DESCRIPTION}</span>
                <span className="max-md:hidden">{site.description}</span>
              </p>
            </div>
            <a
              href={whatsappLink(CONTACT_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'whatsapp', size: 'md', className: 'mt-6 hidden md:inline-flex' })}
            >
              <WhatsAppIcon aria-hidden />
              Peça pelo WhatsApp
              <span className="sr-only">(abre em nova aba)</span>
            </a>
            <MobileContact />
          </div>

          <div className="grid grid-cols-1 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-10">
            <FooterColumn
              title="Navegação"
              listClassName="max-md:mt-2 max-md:grid max-md:grid-cols-2 max-md:gap-x-6 max-md:gap-y-0"
            >
              {PRIMARY_NAV.map((key) => (
                <li key={key}>
                  <Link to={NAV_ITEMS[key].href} className={LINK}>
                    {NAV_ITEMS[key].label}
                  </Link>
                </li>
              ))}
            </FooterColumn>

            <MobileCategories categories={topCategories.map(({ item }) => item)} isLoading={isLoading} />

            <FooterColumn title="Categorias" className="max-md:hidden">
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

            {/* no celular o atendimento já aparece logo abaixo da marca */}
            <FooterColumn title="Atendimento" className="max-md:hidden">
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

        <div className="mt-8 md:mt-16">
          <div aria-hidden className="logo-stripe h-[2px] w-full rounded-full opacity-80" />
          <div className="flex flex-col-reverse gap-3 pt-6 md:flex-row md:items-center md:justify-between md:gap-4">
            <Link
              to="/admin"
              className="inline-flex h-10 items-center gap-1.5 self-center text-xs text-white/50 transition-colors hover:text-white md:hidden"
            >
              <LockKeyhole className="size-3.5" aria-hidden />
              Área administrativa
            </Link>
            <p className="text-xs leading-relaxed text-white/50 max-md:text-center">
              © {year} {site.fullName}. Todos os direitos reservados.
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/[0.06] px-4 text-sm font-semibold text-white/85 ring-1 ring-white/10 transition-colors hover:bg-white hover:text-ink-950 active:bg-white/15 md:h-10 md:w-auto md:self-auto md:text-xs md:text-white/80"
            >
              Voltar ao topo
              <ArrowUp className="size-4 transition-transform duration-300 ease-out-expo group-hover:-translate-y-0.5 md:size-3.5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  className,
  listClassName,
  children,
}: {
  title: string
  className?: string
  listClassName?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <h2 className="eyebrow text-white/55">{title}</h2>
      <ul className={cn('mt-5 flex flex-col items-start gap-3', listClassName)}>{children}</ul>
    </div>
  )
}

/** Celular: atendimento claro e tocável (WhatsApp em destaque + Instagram). */
function MobileContact() {
  return (
    <ul className="mt-6 grid gap-2.5 md:hidden">
      <li>
        <a
          href={whatsappLink(CONTACT_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-15 items-center gap-3.5 rounded-2xl bg-[#25D366] px-4 py-2.5 text-[#0b3d1f] shadow-[0_10px_30px_-14px_rgb(37_211_102/0.8)] transition-[background-color,transform] duration-200 ease-out-expo active:scale-[0.98] active:bg-[#1fc15c]"
        >
          <WhatsAppIcon className="size-7 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[0.9375rem] font-bold">Peça pelo WhatsApp</span>
            <span className="mt-0.5 block text-[0.8125rem] font-semibold tabular-nums opacity-75">{site.whatsapp.display}</span>
          </span>
          <ArrowUpRight className="size-5 shrink-0 opacity-70" aria-hidden />
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      </li>
      <li>
        <a
          href={site.instagram.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center gap-3.5 rounded-2xl bg-white/[0.06] px-4 py-2 ring-1 ring-white/10 transition-colors ring-inset active:bg-white/10"
        >
          <InstagramIcon className="size-[1.35rem] shrink-0 text-white/85" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm">
            <span className="text-white/55">Instagram </span>
            <span className="font-semibold text-white">@{site.instagram.handle}</span>
          </span>
          <ArrowUpRight className="size-4.5 shrink-0 text-white/50" aria-hidden />
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      </li>
    </ul>
  )
}

/** Celular: categorias em faixa com rolagem lateral (a última aparece cortada na borda). */
function MobileCategories({ categories, isLoading }: { categories: { id: string; name: string }[]; isLoading: boolean }) {
  return (
    <section aria-labelledby="footer-categorias-mobile" className="md:hidden">
      <div className="flex items-center justify-between">
        <h2 id="footer-categorias-mobile" className="eyebrow text-white/55">
          Categorias
        </h2>
        <Link
          to="/categorias"
          className="-mr-2 inline-flex h-10 items-center gap-1 rounded-full px-2 text-sm font-semibold text-brand-300 active:text-brand-200"
        >
          Ver todas
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      {isLoading ? (
        <div aria-hidden className="mt-2 flex gap-2 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-10 w-24 shrink-0 rounded-full bg-white/10" />
          ))}
        </div>
      ) : (
        <ul className="scrollbar-none -mx-4 mt-2 flex snap-x scroll-px-4 gap-2 overflow-x-auto overscroll-x-contain px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6">
          {categories.map((category) => (
            <li key={category.id} className="shrink-0 snap-start">
              <Link
                to={catalogHref({ categories: [category.id] })}
                className="inline-flex h-10 items-center rounded-full bg-white/[0.06] px-4 text-sm font-semibold whitespace-nowrap text-white/85 ring-1 ring-white/10 transition-colors ring-inset active:bg-white/15"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
