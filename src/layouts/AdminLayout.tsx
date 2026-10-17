/**
 * Moldura do painel administrativo: sidebar fixa (lg+), topbar com blur e
 * conteúdo com transição curta de entrada a cada troca de rota.
 * A proteção de acesso (RequireAuth) é aplicada no router.
 */
import { m } from 'motion/react'
import { Outlet, useLocation } from 'react-router'
import { AdminSidebar } from '@/components/admin/layout/admin-sidebar'
import { AdminTopbar } from '@/components/admin/layout/admin-topbar'

export function AdminLayout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <a
        href="#admin-conteudo"
        onClick={(event) => {
          // foca o conteúdo sem alterar a URL (o hash dispararia uma navegação do router)
          event.preventDefault()
          document.getElementById('admin-conteudo')?.focus()
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-bg"
      >
        Pular para o conteúdo
      </a>

      <AdminSidebar />

      <div className="flex min-h-dvh min-w-0 flex-col lg:pl-64">
        <AdminTopbar />
        <main id="admin-conteudo" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
          <m.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8"
          >
            <Outlet />
          </m.div>
        </main>
      </div>
    </div>
  )
}
