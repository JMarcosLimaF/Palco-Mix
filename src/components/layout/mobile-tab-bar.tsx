import { Search } from 'lucide-react'
import { m } from 'motion/react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { WhatsAppIcon } from '@/components/brand/social-icons'
import { whatsappLink } from '@/config/site'
import { cn } from '@/lib/utils'
import { CONTACT_MESSAGE, NAV_ITEMS, TAB_ITEMS, type TabKey } from './nav-config'
import { useTextFieldFocused } from './use-text-field-focused'

export interface MobileTabBarProps {
  /** aba da página atual */
  activeKey: TabKey | null
  /** abre a busca em tela cheia */
  onSearch: () => void
  searchOpen: boolean
}

const TAB =
  'flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl text-xs leading-none font-semibold tracking-tight ' +
  'transition-colors duration-200 select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500'

/**
 * Barra de navegação inferior do celular (< md), estilo app: Início, Catálogo,
 * Buscar (em destaque, no centro), Categorias e WhatsApp — tudo na zona do polegar.
 * Vai para o <body> (o cabeçalho tem backdrop-filter, que prenderia um `fixed`),
 * fica abaixo de modais (z-40) e sai do caminho enquanto o teclado está aberto.
 */
export function MobileTabBar({ activeKey, onSearch, searchOpen }: MobileTabBarProps) {
  const typing = useTextFieldFocused()
  const [inicio, catalogo, categorias] = TAB_ITEMS

  return createPortal(
    <nav
      aria-label="Navegação rápida"
      inert={typing}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-elevated/90 pb-[env(safe-area-inset-bottom)] md:hidden',
        'shadow-[0_-10px_30px_-24px_rgb(13_13_13/0.5)] backdrop-blur-xl backdrop-saturate-150 dark:shadow-[0_-10px_30px_-20px_rgb(0_0_0/0.9)]',
        'transition-transform duration-300 ease-out-expo',
        typing && 'translate-y-[calc(100%+1.5rem)]',
      )}
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5 px-1">
        <li className="p-1">
          <TabLink tab={inicio} active={activeKey === inicio} />
        </li>
        <li className="p-1">
          <TabLink tab={catalogo} active={activeKey === catalogo} />
        </li>
        <li className="p-1">
          <button
            type="button"
            onClick={onSearch}
            aria-label="Buscar produtos"
            aria-haspopup="dialog"
            aria-expanded={searchOpen}
            className={cn(TAB, 'group relative justify-end pb-1 text-fg')}
          >
            {/* botão central em destaque, "saltando" da barra */}
            <span
              aria-hidden
              className="absolute -top-4 left-1/2 inline-flex size-12 -translate-x-1/2 items-center justify-center rounded-full bg-brand-500 text-white shadow-glow ring-4 ring-elevated transition-transform duration-200 ease-out-expo group-active:scale-95"
            >
              <Search className="size-[1.3rem]" strokeWidth={2.5} />
            </span>
            Buscar
          </button>
        </li>
        <li className="p-1">
          <TabLink tab={categorias} active={activeKey === categorias} />
        </li>
        <li className="p-1">
          <a
            href={whatsappLink(CONTACT_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(TAB, 'text-green-700 active:bg-green-500/10 dark:text-green-400')}
          >
            <span className="inline-flex h-8 w-14 items-center justify-center">
              <WhatsAppIcon className="size-[1.35rem] text-green-600 dark:text-[#25D366]" aria-hidden />
            </span>
            WhatsApp
            <span className="sr-only">(abre em nova aba)</span>
          </a>
        </li>
      </ul>
    </nav>,
    document.body,
  )
}

function TabLink({ tab, active }: { tab: TabKey; active: boolean }) {
  const item = NAV_ITEMS[tab]
  const Icon = item.icon
  return (
    <Link
      to={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(TAB, active ? 'text-brand-600 dark:text-brand-400' : 'text-muted active:bg-surface-2')}
    >
      <span className="relative isolate inline-flex h-8 w-14 items-center justify-center">
        {active && (
          // indicador desliza entre as abas (layoutId)
          <m.span
            layoutId="mobile-tab-active"
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full bg-brand-500/12 dark:bg-brand-400/15"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
          />
        )}
        <Icon className="size-[1.3rem]" strokeWidth={active ? 2.4 : 2} aria-hidden />
      </span>
      {item.label}
    </Link>
  )
}
