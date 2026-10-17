/**
 * Mapa de rotas.
 *
 * Público:  /  ·  /catalogo  ·  /produto/:id  ·  /categorias  ·  /distribuidores
 * Admin:    /admin (login)  ·  /admin/painel  ·  /admin/produtos  ·  /admin/produtos/novo
 *           /admin/produtos/:id  ·  /admin/categorias  ·  /admin/distribuidores  ·  /admin/configuracoes
 *
 * A Home carrega junto do bundle inicial (LCP); o resto é lazy (code splitting),
 * e todo o painel admin fica fora do bundle público.
 */
import { createBrowserRouter, Navigate } from 'react-router'
import { PublicLayout } from '@/layouts/PublicLayout'
import HomePage from '@/pages/HomePage'
import { AppBootFallback, RootLayout } from './root-layout'
import { RouteErrorBoundary } from './route-error'

const page = (loader: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await loader()).default,
})

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    hydrateFallbackElement: <AppBootFallback />,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        Component: PublicLayout,
        children: [
          { index: true, Component: HomePage },
          { path: 'catalogo', lazy: page(() => import('@/pages/CatalogPage')) },
          { path: 'produto/:id', lazy: page(() => import('@/pages/ProductPage')) },
          { path: 'categorias', lazy: page(() => import('@/pages/CategoriesPage')) },
          { path: 'distribuidores', lazy: page(() => import('@/pages/DistributorsPage')) },
          { path: 'destaques', element: <Navigate to="/catalogo?destaque=1" replace /> },
          { path: 'lancamentos', element: <Navigate to="/catalogo?ordem=recentes" replace /> },
          { path: '*', lazy: page(() => import('@/pages/NotFoundPage')) },
        ],
      },
      {
        path: 'admin',
        children: [
          { index: true, lazy: page(() => import('@/pages/admin/LoginPage')) },
          {
            // guard + store/serviço de auth vêm no mesmo chunk lazy (nada do admin no bundle público)
            lazy: async () => ({ Component: (await import('@/layouts/AdminLayout')).ProtectedAdminLayout }),
            children: [
              { path: 'painel', lazy: page(() => import('@/pages/admin/DashboardPage')) },
              { path: 'produtos', lazy: page(() => import('@/pages/admin/ProductsPage')) },
              { path: 'produtos/novo', lazy: page(() => import('@/pages/admin/ProductFormPage')) },
              { path: 'produtos/:id', lazy: page(() => import('@/pages/admin/ProductFormPage')) },
              { path: 'categorias', lazy: page(() => import('@/pages/admin/CategoriesPage')) },
              { path: 'distribuidores', lazy: page(() => import('@/pages/admin/DistributorsPage')) },
              { path: 'configuracoes', lazy: page(() => import('@/pages/admin/SettingsPage')) },
              { path: '*', element: <Navigate to="/admin/painel" replace /> },
            ],
          },
        ],
      },
    ],
  },
], { basename })
