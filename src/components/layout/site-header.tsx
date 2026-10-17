import { LockKeyhole, Menu, Search } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Logo } from '@/components/brand/logo'
import { WhatsAppIcon } from '@/components/brand/social-icons'
import { buttonVariants } from '@/components/ui/button-variants'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { whatsappLink } from '@/config/site'
import { cn } from '@/lib/utils'
import { CategoriesMenu } from './categories-menu'
import { MobileNav } from './mobile-nav'
import { MobileTabBar } from './mobile-tab-bar'
import { NavActivePill } from './nav-active-pill'
import {
  activeNavKey,
  activeTabKey,
  CONTACT_MESSAGE,
  HEADER_LINKS,
  HEADER_NAV_ITEM,
  NAV_ITEMS,
  type NavItem,
} from './nav-config'
import { SearchBox } from './search-box'
import { SearchOverlay } from './search-overlay'
import { useMobileTabBarVisible } from './use-mobile-tab-bar-visible'
import { useScrolledPast } from './use-scrolled-past'
import { useSearchHotkeys } from './use-search-hotkeys'

// 44px no celular (alvo do polegar), 40px a partir do md
const ICON_BUTTON =
  'inline-flex size-11 shrink-0 md:size-10 items-center justify-center rounded-full text-fg transition-colors duration-200 hover:bg-surface-2 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 [&_svg]:size-[1.15rem]'

/**
 * Cabeçalho fixo da vitrine. O estado dele (rolagem, menus) fica isolado aqui:
 * nada nele re-renderiza a página.
 */
export function SiteHeader() {
  const scrolled = useScrolledPast(8)
  const location = useLocation()
  const tabBarVisible = useMobileTabBarVisible()
  const activeKey = activeNavKey(location.pathname, location.search)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // menu mobile e busca em tela cheia fecham ao navegar
  const [locationKey, setLocationKey] = useState(location.key)
  if (locationKey !== location.key) {
    setLocationKey(location.key)
    setMenuOpen(false)
    setSearchOpen(false)
  }

  // "/" e Cmd/Ctrl+K: foca o campo (desktop) ou abre a busca em tela cheia (mobile)
  useSearchHotkeys(() => {
    const input = searchInputRef.current
    if (input && input.offsetParent !== null) {
      input.focus()
      input.select()
    } else {
      setSearchOpen(true)
    }
  })

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b bg-bg/80 backdrop-blur-xl backdrop-saturate-150',
        'transition-[border-color,box-shadow] duration-300 ease-out-expo',
        scrolled
          ? 'border-line shadow-[0_10px_30px_-22px_rgb(13_13_13/0.45)] dark:shadow-[0_10px_30px_-20px_rgb(0_0_0/0.9)]'
          : 'border-transparent',
      )}
    >
      <div className="container-page flex h-16 items-center gap-3 lg:h-18">
        <Link
          to="/"
          aria-label="Palco Mix — página inicial"
          className="-ml-1 flex h-11 shrink-0 items-center rounded-xl px-1 transition-opacity hover:opacity-85"
        >
          <Logo />
        </Link>

        <nav aria-label="Principal" className="hidden min-w-0 flex-1 justify-center lg:flex">
          <ul className="flex items-center gap-0.5">
            <li>
              <HeaderLink item={NAV_ITEMS.catalogo} active={activeKey === 'catalogo'} />
            </li>
            <li>
              <CategoriesMenu active={activeKey === 'categorias'} />
            </li>
            {HEADER_LINKS.map((key) => (
              // entre lg e xl não cabem todos: Lançamentos (também no rodapé e na Home) sai antes do Catálogo
              <li key={key} className={key === 'lancamentos' ? 'hidden xl:block' : undefined}>
                <HeaderLink item={NAV_ITEMS[key]} active={activeKey === key} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <SearchBox inputRef={searchInputRef} className="mr-1 hidden md:block md:w-64 lg:w-48 xl:w-56 2xl:w-72" />

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar produtos"
            aria-haspopup="dialog"
            className={cn(ICON_BUTTON, 'md:hidden')}
          >
            <Search aria-hidden />
          </button>

          <ThemeToggle className="hidden sm:inline-flex" />

          <Link
            to="/admin"
            aria-label="Área administrativa"
            title="Área administrativa"
            className={cn(ICON_BUTTON, 'hidden md:inline-flex')}
          >
            <LockKeyhole aria-hidden />
          </Link>

          <a
            href={whatsappLink(CONTACT_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Fale conosco pelo WhatsApp (abre em nova aba)"
            title="Fale conosco pelo WhatsApp"
            className={buttonVariants({
              variant: 'whatsapp',
              size: 'sm',
              className: 'ml-1 hidden size-10 px-0 sm:inline-flex xl:w-auto xl:px-4',
            })}
          >
            <WhatsAppIcon aria-hidden />
            <span className="hidden xl:inline">Fale conosco</span>
          </a>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            className={cn(ICON_BUTTON, '-mr-2 md:-mr-1.5 lg:hidden')}
          >
            <Menu aria-hidden />
          </button>
        </div>
      </div>

      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
      <MobileNav
        open={menuOpen}
        onOpenChange={setMenuOpen}
        activeKey={activeKey}
        onSearch={() => setSearchOpen(true)}
      />
      {tabBarVisible && (
        <MobileTabBar
          activeKey={activeTabKey(location.pathname)}
          onSearch={() => setSearchOpen(true)}
          searchOpen={searchOpen}
        />
      )}
    </header>
  )
}

function HeaderLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      to={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(HEADER_NAV_ITEM, active ? 'text-fg' : 'text-muted hover:text-fg')}
    >
      {active && <NavActivePill />}
      {item.label}
    </Link>
  )
}
