import { ChevronRight, Menu, Plus } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { LogoMark } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Drawer } from '@/components/ui/modal'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useMediaQuery } from '@/hooks/use-media-query'
import { AdminUserCard, ViewStoreLink } from './admin-account'
import { AdminNav } from './admin-nav'
import { adminSectionTitle, NEW_PRODUCT_PATH } from './admin-nav-items'

/** Barra superior fixa (blur): menu mobile, título da seção, tema e atalho "Novo produto". */
export function AdminTopbar() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const title = adminSectionTitle(pathname)
  const onNewProduct = pathname.replace(/\/+$/, '') === NEW_PRODUCT_PATH

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu do painel"
          aria-haspopup="dialog"
          aria-expanded={menuOpen && !isDesktop}
        >
          <Menu aria-hidden />
        </Button>

        <Link to="/admin/painel" className="rounded-md text-fg lg:hidden" aria-label="Ir para o painel">
          <LogoMark className="h-6" />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
          <span className="hidden text-subtle sm:inline">Admin</span>
          <ChevronRight className="hidden size-3.5 shrink-0 text-subtle sm:block" aria-hidden />
          <div className="relative min-w-0 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <m.p
                key={title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="truncate font-bold tracking-tight text-fg"
              >
                {title}
              </m.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {!onNewProduct && (
            <Link
              to={NEW_PRODUCT_PATH}
              className={buttonVariants({ size: 'sm', className: 'max-sm:size-10 max-sm:px-0' })}
              title="Novo produto"
            >
              <Plus aria-hidden />
              <span className="sr-only sm:not-sr-only">Novo produto</span>
            </Link>
          )}
        </div>
      </div>

      <Drawer
        open={menuOpen && !isDesktop}
        onOpenChange={setMenuOpen}
        side="left"
        title={
          <span className="flex items-center gap-2">
            <LogoMark className="h-5" />
            Painel Palco Mix
          </span>
        }
        description="Navegação do painel administrativo"
        className="w-[min(20rem,86vw)]"
        footer={<AdminUserCard className="w-full shadow-none" />}
      >
        <nav aria-label="Painel administrativo" className="-mx-2">
          <p className="eyebrow mb-2 px-3 text-subtle">Gestão</p>
          <AdminNav pillId="admin-nav-pill-drawer" onNavigate={() => setMenuOpen(false)} />
          <div className="mt-4 border-t border-line pt-4">
            <ViewStoreLink />
          </div>
        </nav>
      </Drawer>
    </header>
  )
}
