/**
 * Itens de navegação do painel + utilitários de exibição do usuário/rota.
 * (arquivo .ts separado: os .tsx exportam só componentes)
 */
import { LayoutDashboard, Package, Settings, Tags, Truck, type LucideIcon } from 'lucide-react'

export interface AdminNavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { to: '/admin/painel', label: 'Painel', icon: LayoutDashboard },
  { to: '/admin/produtos', label: 'Produtos', icon: Package },
  { to: '/admin/categorias', label: 'Categorias', icon: Tags },
  { to: '/admin/distribuidores', label: 'Distribuidores', icon: Truck },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export const NEW_PRODUCT_PATH = '/admin/produtos/novo'

/** Título da seção atual, derivado da rota (topbar). */
export function adminSectionTitle(pathname: string): string {
  const path = pathname.replace(/\/+$/, '')
  if (path === NEW_PRODUCT_PATH) return 'Novo produto'
  if (/^\/admin\/produtos\/[^/]+$/.test(path)) return 'Editar produto'
  const item = ADMIN_NAV_ITEMS.find((i) => path === i.to || path.startsWith(`${i.to}/`))
  return item?.label ?? 'Painel'
}

/** "Maria Clara Souza" → "MS" · "Administrador" → "AD" */
export function userInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

export function firstName(name: string | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? ''
}
