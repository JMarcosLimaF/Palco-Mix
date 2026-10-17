import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { parseCatalogParams, storefrontQuery, toCatalogParams } from '@/lib/catalog-params'
import type { ProductQuery } from '@/types/catalog'

export interface CatalogUpdateOptions {
  /** substitui a entrada do histórico (digitação na busca) */
  replace?: boolean
  /** mantém a página atual (só a paginação usa) */
  keepPage?: boolean
}

/** `location.state` da vitrine: drawer de filtros aberto (o "voltar" do celular fecha). */
interface CatalogHistoryState {
  filtersOpen?: boolean
  /** busca (?…) no momento em que o drawer abriu */
  filtersFrom?: string
}

/** `state` da entrada atual do histórico (o React Router guarda em history.state.usr). */
function historyUsr(): CatalogHistoryState | null {
  return (window.history.state as { usr?: CatalogHistoryState | null } | null)?.usr ?? null
}

/**
 * Estado da vitrine 100% na URL (/catalogo?...).
 *
 * - `query` é estável enquanto os filtros não mudam (abrir a Visualização
 *   Rápida, que só mexe em `?p=`, não gera um novo objeto);
 * - `update`/`clear*` têm identidade estável e sempre partem da URL mais recente;
 * - qualquer alteração de filtro remove `?p=` e volta para a página 1;
 * - o drawer de filtros (mobile) é uma entrada do histórico: abrir empilha,
 *   os filtros trocados com ele aberto substituem essa entrada e o "voltar"
 *   fecha o drawer (desfazendo a sessão de filtros, como "cancelar").
 */
export function useCatalogUrl() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const canonical = toCatalogParams(storefrontQuery(parseCatalogParams(searchParams))).toString()
  const query = useMemo(() => parseCatalogParams(new URLSearchParams(canonical)), [canonical])
  const historyState = location.state as CatalogHistoryState | null
  const filtersOpen = Boolean(historyState?.filtersOpen)

  const latest = useRef({ query, setSearchParams })
  useLayoutEffect(() => {
    latest.current = { query, setSearchParams }
  })
  // evita um 2º "voltar" (dois toques no véu) antes de o primeiro concluir
  const closing = useRef(false)
  useLayoutEffect(() => {
    closing.current = false
  }, [location.key])

  const commit = useCallback((next: ProductQuery, options: CatalogUpdateOptions = {}) => {
    const clean: ProductQuery = { ...next }
    if (!options.keepPage) delete clean.page
    if (clean.sort === 'relevance' && !clean.search?.trim()) delete clean.sort
    const state = historyUsr()
    const inDrawer = Boolean(state?.filtersOpen)
    latest.current.setSearchParams(toCatalogParams(clean), {
      preventScrollReset: true,
      // com o drawer aberto: substitui a entrada dele e mantém o estado
      replace: inDrawer || (options.replace ?? false),
      state: inDrawer ? state : undefined,
    })
  }, [])

  // abrir/fechar leem a URL do navegador (como useOpenQuickView): um filtro
  // aplicado no blur logo antes do toque em "Ver produtos" já está nela, mesmo
  // que o React ainda não tenha renderizado a nova location
  const openFilters = useCallback(() => {
    const { pathname, search } = window.location
    if (historyUsr()?.filtersOpen) return
    navigate(
      { pathname, search },
      { preventScrollReset: true, state: { filtersOpen: true, filtersFrom: search } satisfies CatalogHistoryState },
    )
  }, [navigate])

  const closeFilters = useCallback(() => {
    const { pathname, search } = window.location
    const drawer = historyUsr()
    if (!drawer?.filtersOpen || closing.current) return
    closing.current = true
    // nada mudou: só desempilha a entrada do drawer
    if (drawer.filtersFrom === search) navigate(-1)
    // filtros trocados: ficam valendo e a entrada deixa de ser "drawer aberto"
    else navigate({ pathname, search }, { replace: true, preventScrollReset: true })
  }, [navigate])

  const update = useCallback(
    (patch: Partial<ProductQuery>, options?: CatalogUpdateOptions) => commit({ ...latest.current.query, ...patch }, options),
    [commit],
  )

  /** Remove filtros (categoria, distribuidor, preço, destaque, promoção); mantém busca e ordenação. */
  const clearFilters = useCallback(() => {
    const { search, sort } = latest.current.query
    commit({ search, sort })
  }, [commit])

  /** Remove filtros e busca; mantém a ordenação. */
  const clearAll = useCallback(() => {
    commit({ sort: latest.current.query.sort })
  }, [commit])

  return { query, canonical, update, clearFilters, clearAll, filtersOpen, openFilters, closeFilters }
}
