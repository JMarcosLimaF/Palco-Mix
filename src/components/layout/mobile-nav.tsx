import { ArrowUpRight, ChevronRight, LockKeyhole, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Logo } from '@/components/brand/logo'
import { InstagramIcon, WhatsAppIcon } from '@/components/brand/social-icons'
import { buttonVariants } from '@/components/ui/button-variants'
import { Drawer } from '@/components/ui/modal'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { site, whatsappLink } from '@/config/site'
import { catalogHref, parseCatalogParams } from '@/lib/catalog-params'
import { cn } from '@/lib/utils'
import { CONTACT_MESSAGE, NAV_ITEMS, PRIMARY_NAV, type NavKey } from './nav-config'
import { useNavTaxonomy } from './use-nav-taxonomy'

export interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** item ativo conforme a URL */
  activeKey: NavKey | null
  /** abre a busca em tela cheia */
  onSearch: () => void
}

/** Menu lateral do celular/tablet (fecha sozinho ao navegar — controlado pelo cabeçalho). */
export function MobileNav({ open, onOpenChange, activeKey, onSearch }: MobileNavProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      side="left"
      title={<Logo />}
      footer={
        <>
          <Link
            to="/admin"
            className={buttonVariants({ variant: 'outline', size: 'md', className: 'min-w-0 flex-1' })}
          >
            <LockKeyhole aria-hidden />
            Área administrativa
          </Link>
          <ThemeToggle className="size-11 shrink-0 border border-line-strong" />
        </>
      }
    >
      <MobileNavBody activeKey={activeKey} onSearch={onSearch} />
    </Drawer>
  )
}

function MobileNavBody({ activeKey, onSearch }: Pick<MobileNavProps, 'activeKey' | 'onSearch'>) {
  const { categories, isLoading } = useNavTaxonomy()
  const location = useLocation()
  const activeCategories =
    location.pathname === '/catalogo' ? (parseCatalogParams(new URLSearchParams(location.search)).categories ?? []) : []

  return (
    <div className="flex flex-col gap-8">
      <button
        type="button"
        onClick={onSearch}
        aria-haspopup="dialog"
        className="flex h-12 w-full items-center gap-3 rounded-full bg-surface-2 px-4 text-left text-sm text-subtle transition-colors hover:bg-line"
      >
        <Search className="size-[1.1rem] text-brand-500" aria-hidden />
        Buscar produtos, marcas ou código
      </button>

      <nav aria-label="Menu principal">
        <ul className="flex flex-col gap-1">
          {PRIMARY_NAV.map((key) => {
            const item = NAV_ITEMS[key]
            const Icon = item.icon
            const current = activeKey === key
            return (
              <li key={key}>
                <Link
                  to={item.href}
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'group flex min-h-14 items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors duration-200',
                    current ? 'bg-brand-500/10' : 'hover:bg-surface-2',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200',
                      current ? 'bg-brand-500 text-white shadow-glow' : 'bg-surface-2 text-fg group-hover:bg-elevated',
                    )}
                  >
                    <Icon className="size-[1.1rem]" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block text-[0.95rem] font-bold tracking-tight',
                        current ? 'text-brand-700 dark:text-brand-300' : 'text-fg',
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="block truncate text-xs text-muted">{item.hint}</span>
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-subtle transition-transform duration-200 ease-out-expo group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <section aria-labelledby="mobile-nav-categorias">
        <div className="flex items-baseline justify-between px-1">
          <h2 id="mobile-nav-categorias" className="eyebrow text-subtle">
            Categorias
          </h2>
          <Link to="/categorias" className="text-xs font-semibold text-brand-600 dark:text-brand-400">
            Ver todas
          </Link>
        </div>
        {isLoading ? (
          <div aria-hidden className="mt-3 flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-10 w-24 rounded-full" />
            ))}
          </div>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {categories.map(({ item, count }) => {
              const current = activeCategories.length === 1 && activeCategories[0] === item.id
              return (
                <li key={item.id}>
                  <Link
                    to={catalogHref({ categories: [item.id] })}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors duration-200',
                      current
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-line text-fg hover:border-line-strong hover:bg-surface-2',
                    )}
                  >
                    {item.name}
                    <span className={cn('text-xs tabular-nums', current ? 'text-white/80' : 'text-subtle')}>
                      <span className="sr-only">(</span>
                      {count}
                      <span className="sr-only"> {count === 1 ? 'produto' : 'produtos'})</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="mobile-nav-atendimento">
        <h2 id="mobile-nav-atendimento" className="eyebrow px-1 text-subtle">
          Atendimento
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          <li>
            <a
              href={whatsappLink(CONTACT_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-line p-3 transition-colors hover:bg-surface-2"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white">
                <WhatsAppIcon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">WhatsApp</span>
                <span className="block text-xs text-muted tabular-nums">{site.whatsapp.display}</span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-subtle" aria-hidden />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          </li>
          <li>
            <a
              href={site.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-line p-3 transition-colors hover:bg-surface-2"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-fg text-bg">
                <InstagramIcon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">Instagram</span>
                <span className="block text-xs text-muted">@{site.instagram.handle}</span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-subtle" aria-hidden />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          </li>
        </ul>
      </section>
    </div>
  )
}
