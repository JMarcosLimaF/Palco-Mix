/**
 * Lógica compartilhada da Busca Inteligente (campo do cabeçalho e tela cheia mobile):
 * busca global (não espelha ?q= nem herda os filtros do catálogo — refinar é com
 * o campo dos filtros da vitrine), debounce, sugestões de produtos,
 * categorias e distribuidores que casam com o termo, buscas populares,
 * lista linear de opções para o teclado (↑ ↓ Enter) e as ações de cada opção.
 */
import { useMemo, useState, type KeyboardEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useCatalogLookups, useSearchSuggestions } from '@/hooks/catalog'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useQuickView } from '@/hooks/use-quick-view'
import { catalogHref, QUICK_VIEW_PARAM } from '@/lib/catalog-params'
import type { Category, Distributor, Product } from '@/types/catalog'
import { nameMatches, nameScore } from './search-utils'
import { useNavTaxonomy, type TaxonomyEntry } from './use-nav-taxonomy'

/** Mínimo de caracteres para consultar (igual ao hook useSearchSuggestions). */
export const MIN_SEARCH_LENGTH = 2
const DEBOUNCE_MS = 200
const PRODUCT_LIMIT = 6
const TAXONOMY_LIMIT = 3
const POPULAR_PER_KIND = 3

export interface ProductOption {
  kind: 'product'
  key: string
  product: Product
  distributorName: string
  categoryName: string
}
export interface CategoryOption {
  kind: 'category'
  key: string
  category: Category
  count: number
}
export interface DistributorOption {
  kind: 'distributor'
  key: string
  distributor: Distributor
  count: number
}
export interface AllResultsOption {
  kind: 'all'
  key: string
  term: string
  /** null enquanto o termo novo é consultado (os itens exibidos ainda são do anterior) */
  total: number | null
}
export type PopularOption = CategoryOption | DistributorOption
export type SearchOption = ProductOption | CategoryOption | DistributorOption | AllResultsOption

/**
 * idle    → campo vazio/curto: buscas populares
 * loading → aguardando o primeiro resultado do termo
 * results → há sugestões
 * empty   → nada casou
 */
export type SearchStatus = 'idle' | 'loading' | 'results' | 'empty'

/** Destino de cada opção (href real dos links: abrir em nova aba funciona). */
export function optionHref(option: SearchOption): string {
  switch (option.kind) {
    case 'product':
      return `/produto/${option.product.id}`
    case 'category':
      return catalogHref({ categories: [option.category.id] })
    case 'distributor':
      return catalogHref({ distributors: [option.distributor.id] })
    case 'all':
      return catalogHref({ search: option.term })
  }
}

function toCategoryOption(entry: TaxonomyEntry<Category>, prefix: string): CategoryOption {
  return { kind: 'category', key: `${prefix}c:${entry.item.id}`, category: entry.item, count: entry.count }
}

function toDistributorOption(entry: TaxonomyEntry<Distributor>, prefix: string): DistributorOption {
  return { kind: 'distributor', key: `${prefix}d:${entry.item.id}`, distributor: entry.item, count: entry.count }
}

function matchTaxonomy<T extends { name: string }>(entries: TaxonomyEntry<T>[], term: string): TaxonomyEntry<T>[] {
  if (!term) return []
  return entries
    .filter((e) => nameMatches(e.item.name, term))
    .sort((a, b) => nameScore(b.item.name, term) - nameScore(a.item.name, term) || b.count - a.count)
    .slice(0, TAXONOMY_LIMIT)
}

export interface SearchSuggestionsModel {
  /** valor bruto do campo */
  value: string
  setValue: (value: string) => void
  /** valor do campo sem espaços nas pontas */
  query: string
  /** termo (com debounce) ao qual as sugestões exibidas se referem */
  term: string
  status: SearchStatus
  /** digitando ou consultando (spinner discreto) */
  isBusy: boolean
  products: ProductOption[]
  categories: CategoryOption[]
  distributors: DistributorOption[]
  popular: PopularOption[]
  /** "Ver todos os N resultados" */
  all: AllResultsOption | null
  /** opções na ordem do teclado */
  options: SearchOption[]
  activeKey: string | null
  activeOption: SearchOption | null
  setActiveKey: (key: string | null) => void
  /** ↑/↓ — percorre as opções passando pelo próprio campo (posição -1) */
  move: (delta: 1 | -1) => void
  /** Executa a opção: produto → Visualização Rápida; demais → navega */
  activate: (option: SearchOption) => void
  /** Enter: opção ativa, ou /catalogo?q=termo */
  submit: () => void
  /** Trata ↑ ↓ Enter no campo. Retorna true quando consumiu a tecla. */
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => boolean
}

export function useSearchSuggestionsModel(): SearchSuggestionsModel {
  const location = useLocation()
  const navigate = useNavigate()
  const quickView = useQuickView()
  const lookups = useCatalogLookups()
  const taxonomy = useNavTaxonomy()

  // Busca global: limpa o campo a cada navegação real (abrir/fechar a Visualização Rápida não conta).
  const urlParams = new URLSearchParams(location.search)
  urlParams.delete(QUICK_VIEW_PARAM)
  const syncKey = `${location.pathname}?${urlParams.toString()}`
  const [value, setValueState] = useState('')
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [syncedKey, setSyncedKey] = useState(syncKey)
  if (syncedKey !== syncKey) {
    setSyncedKey(syncKey)
    setValueState('')
    setActiveKey(null)
  }

  const query = value.trim()
  const debounced = useDebouncedValue(query, DEBOUNCE_MS)
  const term = debounced.length >= MIN_SEARCH_LENGTH ? debounced : ''
  const suggestions = useSearchSuggestions(term, PRODUCT_LIMIT)
  // com o termo curto a consulta fica desabilitada; ignora o "placeholder" anterior
  const data = term ? suggestions.data : undefined
  // keepPreviousData: enquanto o termo novo é consultado, `data` ainda é do termo anterior
  const stale = Boolean(data) && suggestions.isPlaceholderData

  // as opções mudam com o termo: a opção ativa antiga deixa de existir
  const [activeTerm, setActiveTerm] = useState(term)
  if (activeTerm !== term) {
    setActiveTerm(term)
    setActiveKey(null)
  }

  const { categoryName, distributorName } = lookups
  const products = useMemo<ProductOption[]>(
    () =>
      (data?.items ?? []).map((product) => ({
        kind: 'product',
        key: `p:${product.id}`,
        product,
        distributorName: distributorName(product.distributor),
        categoryName: categoryName(product.category),
      })),
    [data, categoryName, distributorName],
  )

  const categories = useMemo(
    () => matchTaxonomy(taxonomy.categories, term).map((e) => toCategoryOption(e, '')),
    [taxonomy.categories, term],
  )
  const distributors = useMemo(
    () => matchTaxonomy(taxonomy.distributors, term).map((e) => toDistributorOption(e, '')),
    [taxonomy.distributors, term],
  )
  const popular = useMemo<PopularOption[]>(
    () => [
      ...taxonomy.topCategories.slice(0, POPULAR_PER_KIND).map((e) => toCategoryOption(e, 'pop-')),
      ...taxonomy.topDistributors.slice(0, POPULAR_PER_KIND).map((e) => toDistributorOption(e, 'pop-')),
    ],
    [taxonomy.topCategories, taxonomy.topDistributors],
  )

  const settled = debounced === query && !suggestions.isFetching
  const hasMatches = products.length + categories.length + distributors.length > 0
  let status: SearchStatus
  if (query.length < MIN_SEARCH_LENGTH) status = 'idle'
  else if (!data) status = 'loading'
  else if (hasMatches) status = 'results'
  else status = settled ? 'empty' : 'loading'

  const isBusy = query.length >= MIN_SEARCH_LENGTH && !settled
  const total = stale ? null : (data?.total ?? 0)
  const all: AllResultsOption | null = status === 'results' ? { kind: 'all', key: 'all', term, total } : null

  const options: SearchOption[] =
    status === 'results'
      ? [...products, ...categories, ...distributors, ...(all ? [all] : [])]
      : status === 'idle' || status === 'empty'
        ? popular
        : []
  const activeOption = (activeKey && options.find((o) => o.key === activeKey)) || null

  function setValue(next: string) {
    setValueState(next)
    setActiveKey(null)
  }

  function move(delta: 1 | -1) {
    if (options.length === 0) return
    const index = activeOption ? options.indexOf(activeOption) : -1
    let next = index + delta
    if (next >= options.length) next = -1
    else if (next < -1) next = options.length - 1
    setActiveKey(next === -1 ? null : options[next].key)
  }

  function activate(option: SearchOption) {
    if (option.kind === 'product') quickView.open(option.product.id)
    else navigate(optionHref(option))
  }

  function submit() {
    if (activeOption) {
      activate(activeOption)
      return
    }
    navigate(catalogHref({ search: query || undefined }))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): boolean {
    if (event.nativeEvent.isComposing) return false
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        move(1)
        return true
      case 'ArrowUp':
        event.preventDefault()
        move(-1)
        return true
      case 'Enter':
        if (!activeOption) return false
        event.preventDefault()
        activate(activeOption)
        return true
      default:
        return false
    }
  }

  return {
    value,
    setValue,
    query,
    term,
    status,
    isBusy,
    products,
    categories,
    distributors,
    popular,
    all,
    options,
    activeKey,
    activeOption,
    setActiveKey,
    move,
    activate,
    submit,
    handleKeyDown,
  }
}
