import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { parseCatalogParams, toCatalogParams } from '@/lib/catalog-params'
import type { ProductQuery } from '@/types/catalog'

export interface CatalogUpdateOptions {
  /** substitui a entrada do histórico (digitação na busca) */
  replace?: boolean
  /** mantém a página atual (só a paginação usa) */
  keepPage?: boolean
}

/**
 * Estado da vitrine 100% na URL (/catalogo?...).
 *
 * - `query` é estável enquanto os filtros não mudam (abrir a Visualização
 *   Rápida, que só mexe em `?p=`, não gera um novo objeto);
 * - `update`/`clear*` têm identidade estável e sempre partem da URL mais recente;
 * - qualquer alteração de filtro remove `?p=` e volta para a página 1.
 */
export function useCatalogUrl() {
  const [searchParams, setSearchParams] = useSearchParams()
  const canonical = toCatalogParams(parseCatalogParams(searchParams)).toString()
  const query = useMemo(() => parseCatalogParams(new URLSearchParams(canonical)), [canonical])

  const latest = useRef({ query, setSearchParams })
  useLayoutEffect(() => {
    latest.current = { query, setSearchParams }
  })

  const commit = useCallback((next: ProductQuery, options: CatalogUpdateOptions = {}) => {
    const clean: ProductQuery = { ...next }
    if (!options.keepPage) delete clean.page
    if (clean.sort === 'relevance' && !clean.search?.trim()) delete clean.sort
    latest.current.setSearchParams(toCatalogParams(clean), {
      preventScrollReset: true,
      replace: options.replace ?? false,
    })
  }, [])

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

  return { query, canonical, update, clearFilters, clearAll }
}
