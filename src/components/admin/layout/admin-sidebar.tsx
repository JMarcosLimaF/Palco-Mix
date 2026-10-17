import { Link } from 'react-router'
import { Logo } from '@/components/brand/logo'
import { Badge } from '@/components/ui/badge'
import { AdminUserCard, ViewStoreLink } from './admin-account'
import { AdminNav } from './admin-nav'

/** Barra lateral fixa do painel (lg+). No mobile a mesma navegação vive no Drawer da topbar. */
export function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 shrink-0 items-center gap-2 px-4">
        <Link
          to="/admin/painel"
          className="rounded-lg outline-offset-4 transition-opacity duration-200 hover:opacity-80"
          aria-label="Palco Mix — ir para o painel"
        >
          <Logo />
        </Link>
        <Badge tone="dark" className="h-5 px-2 text-[0.625rem] tracking-[0.14em] uppercase">
          Admin
        </Badge>
      </div>

      <nav aria-label="Painel administrativo" className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-3 pt-4 pb-6">
        <p className="eyebrow mb-2 px-3 text-subtle">Gestão</p>
        <AdminNav pillId="admin-nav-pill-sidebar" />
      </nav>

      <div className="shrink-0 space-y-2 border-t border-line p-3">
        <ViewStoreLink />
        <AdminUserCard />
      </div>
    </aside>
  )
}
