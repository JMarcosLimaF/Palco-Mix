/**
 * Estado da listagem de produtos do admin na URL (/admin/produtos?...).
 * Voltar da edição preserva busca, filtros, ordenação e página.
 *
 *   q=chinelo  status=todos|ativos|inativos  categoria=<id>  distribuidor=<id>
 *   destaque=1  promo=1  ordem=recentes|relevancia|a-z|menor-preco|maior-preco  pagina=2  porPagina=10|25|50|100
 */
import type { ProductQuery } from '@/types/catalog'

export type StatusFilter = 'all' | 'active' | 'inactive'
export type AdminSort = 'relevance' | 'recent' | 'name-asc' | 'price-asc' | 'price-desc'

export interface AdminProductFilters {
  search: string
  status: StatusFilter
  /** id da categoria ('' = todas) */
  category: string
  /** id do distribuidor ('' = todos) */
  distributor: string
  featured: boolean
  /** somente com desconto à vista (promoPrice) — na URL continua `promo=1` */
  onSale: boolean
  /** ausente = padrão do motor (relevância com busca, recentes sem) */
  sort?: AdminSort
  page: number
  pageSize: number
}

export type AdminFiltersPatch = Partial<AdminProductFilters>

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
export const DEFAULT_PAGE_SIZE = 25

const STATUS_TO_PARAM: Record<StatusFilter, string> = { all: 'todos', active: 'ativos', inactive: 'inativos' }
const SORT_TO_PARAM: Record<AdminSort, string> = {
  relevance: 'relevancia',
  recent: 'recentes',
  'name-asc': 'a-z',
  'price-asc': 'menor-preco',
  'price-desc': 'maior-preco',
}

const invert = <T extends string>(map: Record<T, string>) =>
  Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k])) as Record<string, T>

const PARAM_TO_STATUS = invert(STATUS_TO_PARAM)
const PARAM_TO_SORT = invert(SORT_TO_PARAM)

export const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Todos os status' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
]

export const ADMIN_SORT_OPTIONS: Array<{ value: AdminSort; label: string }> = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'name-asc', label: 'Nome A–Z' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
]

export const RELEVANCE_OPTION: { value: AdminSort; label: string } = { value: 'relevance', label: 'Mais relevantes' }

export function parseAdminProductParams(params: URLSearchParams): AdminProductFilters {
  const pageSizeRaw = Number(params.get('porPagina'))
  const pageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(pageSizeRaw) ? pageSizeRaw : DEFAULT_PAGE_SIZE
  const pageRaw = Number(params.get('pagina'))
  return {
    search: params.get('q') ?? '',
    status: PARAM_TO_STATUS[params.get('status') ?? ''] ?? 'all',
    category: params.get('categoria')?.trim() ?? '',
    distributor: params.get('distribuidor')?.trim() ?? '',
    featured: params.get('destaque') === '1',
    onSale: params.get('promo') === '1',
    sort: PARAM_TO_SORT[params.get('ordem') ?? ''],
    page: Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1,
    pageSize,
  }
}

export function toAdminProductParams(filters: AdminProductFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search.trim()) params.set('q', filters.search.trim())
  if (filters.status !== 'all') params.set('status', STATUS_TO_PARAM[filters.status])
  if (filters.category) params.set('categoria', filters.category)
  if (filters.distributor) params.set('distribuidor', filters.distributor)
  if (filters.featured) params.set('destaque', '1')
  if (filters.onSale) params.set('promo', '1')
  if (filters.sort) params.set('ordem', SORT_TO_PARAM[filters.sort])
  if (filters.page > 1) params.set('pagina', String(filters.page))
  if (filters.pageSize !== DEFAULT_PAGE_SIZE) params.set('porPagina', String(filters.pageSize))
  return params
}

/** Aplica uma alteração; qualquer mudança real que não seja de página volta para a página 1. */
export function applyAdminFiltersPatch(current: URLSearchParams, rawPatch: AdminFiltersPatch): URLSearchParams {
  const base = parseAdminProductParams(current)
  const patch = rawPatch.search === undefined ? rawPatch : { ...rawPatch, search: rawPatch.search.trim() }
  const next: AdminProductFilters = { ...base, ...patch }
  const changed = (Object.keys(patch) as Array<keyof AdminProductFilters>).some(
    (key) => key !== 'page' && patch[key] !== base[key],
  )
  if (patch.page === undefined && changed) next.page = 1
  return toAdminProductParams(next)
}

/** Limpa busca e filtros (mantém itens por página). */
export function clearAdminFilters(current: URLSearchParams): URLSearchParams {
  const { pageSize } = parseAdminProductParams(current)
  return toAdminProductParams({
    search: '',
    status: 'all',
    category: '',
    distributor: '',
    featured: false,
    onSale: false,
    page: 1,
    pageSize,
  })
}

export function adminFiltersToQuery(filters: AdminProductFilters): ProductQuery {
  return {
    search: filters.search.trim() || undefined,
    status: filters.status,
    categories: filters.category ? [filters.category] : undefined,
    distributors: filters.distributor ? [filters.distributor] : undefined,
    featured: filters.featured || undefined,
    onSale: filters.onSale || undefined,
    sort: filters.sort,
    page: filters.page,
    pageSize: filters.pageSize,
  }
}

/** Filtros que restringem o resultado (exclui busca, ordenação e paginação). */
export function countAdminFilters(filters: AdminProductFilters): number {
  return (
    (filters.status !== 'all' ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.distributor ? 1 : 0) +
    (filters.featured ? 1 : 0) +
    (filters.onSale ? 1 : 0)
  )
}

export function hasAdminFilters(filters: AdminProductFilters): boolean {
  return filters.search.trim() !== '' || countAdminFilters(filters) > 0
}

/** Estado de navegação enviado ao abrir o formulário a partir da lista. */
export interface ProductFormLocationState {
  fromList?: boolean
}

export const FROM_LIST_STATE: ProductFormLocationState = { fromList: true }
