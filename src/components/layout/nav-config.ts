/**
 * Itens de navegação da casca pública (cabeçalho, menu mobile e rodapé)
 * e a regra que decide qual item está ativo a partir da URL.
 */
import { House, LayoutGrid, Sparkles, Star, Tags, Truck, type LucideIcon } from 'lucide-react'
import { catalogHref, parseCatalogParams } from '@/lib/catalog-params'

/** Mensagem padrão dos botões de WhatsApp da casca pública. */
export const CONTACT_MESSAGE = 'Olá! Vim pelo site da Palco Mix e gostaria de mais informações.'

export type NavKey = 'inicio' | 'catalogo' | 'categorias' | 'distribuidores' | 'destaques' | 'lancamentos'

export interface NavItem {
  key: NavKey
  label: string
  href: string
  icon: LucideIcon
  /** linha de apoio no menu mobile */
  hint: string
}

export const NAV_ITEMS: Record<NavKey, NavItem> = {
  inicio: { key: 'inicio', label: 'Início', href: '/', icon: House, hint: 'Vitrine principal' },
  catalogo: { key: 'catalogo', label: 'Catálogo', href: '/catalogo', icon: LayoutGrid, hint: 'Todos os produtos' },
  categorias: { key: 'categorias', label: 'Categorias', href: '/categorias', icon: Tags, hint: 'Tênis, sandálias, chinelos…' },
  distribuidores: {
    key: 'distribuidores',
    label: 'Distribuidores',
    href: '/distribuidores',
    icon: Truck,
    hint: 'As marcas que trabalhamos',
  },
  destaques: {
    key: 'destaques',
    label: 'Destaques',
    href: catalogHref({ featured: true }),
    icon: Star,
    hint: 'Seleção da Palco Mix',
  },
  lancamentos: {
    key: 'lancamentos',
    label: 'Lançamentos',
    href: catalogHref({ sort: 'recent' }),
    icon: Sparkles,
    hint: 'Os mais recentes do catálogo',
  },
}

/** Ordem do menu mobile e da coluna "Navegação" do rodapé. */
export const PRIMARY_NAV: NavKey[] = ['inicio', 'catalogo', 'categorias', 'distribuidores', 'destaques', 'lancamentos']

/** Links simples do cabeçalho desktop (Categorias é um menu à parte). */
export const HEADER_LINKS: NavKey[] = ['distribuidores', 'destaques', 'lancamentos']

/** Qual item de navegação representa a URL atual (null = nenhum). */
export function activeNavKey(pathname: string, search: string): NavKey | null {
  if (pathname === '/') return 'inicio'
  if (pathname === '/categorias') return 'categorias'
  if (pathname === '/distribuidores') return 'distribuidores'
  if (pathname !== '/catalogo') return null
  const query = parseCatalogParams(new URLSearchParams(search))
  if (query.featured) return 'destaques'
  if (query.sort === 'recent') return 'lancamentos'
  if (query.categories?.length) return 'categorias'
  if (query.distributors?.length) return 'distribuidores'
  return 'catalogo'
}

/** Classes base de um item da navegação desktop (link ou botão). */
export const HEADER_NAV_ITEM =
  'relative isolate inline-flex h-9 items-center gap-1 rounded-full px-3 text-[0.8125rem] font-semibold whitespace-nowrap ' +
  'transition-colors duration-200 ease-out-expo 2xl:px-3.5 2xl:text-sm ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500'

/** Sublinhado animado (rodapé e links de texto sobre fundo escuro). */
export const UNDERLINE_LINK =
  'bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat pb-0.5 ' +
  'transition-[background-size,color] duration-300 ease-out-expo hover:bg-[length:100%_1px] focus-visible:bg-[length:100%_1px]'
