import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { QUICK_VIEW_PARAM } from '@/lib/catalog-params'

interface QuickViewState {
  quickView?: boolean
}

/**
 * Só a ação de abrir, sem assinar a URL: quem usa (ex.: os 24 ProductCards da
 * grade) não re-renderiza a cada mudança de filtro/página. Lê a URL no clique.
 */
export function useOpenQuickView() {
  const navigate = useNavigate()
  return useCallback(
    (id: string) => {
      const { pathname, search } = window.location
      const next = new URLSearchParams(search)
      next.set(QUICK_VIEW_PARAM, id)
      // o React Router guarda o `state` da navegação em history.state.usr
      const current = (window.history.state as { usr?: QuickViewState } | null)?.usr
      navigate(
        { pathname, search: `?${next.toString()}` },
        { preventScrollReset: true, replace: Boolean(current?.quickView), state: { quickView: true } satisfies QuickViewState },
      )
    },
    [navigate],
  )
}

/**
 * Visualização Rápida controlada pela URL (?p=<id>):
 * - abrir empilha no histórico → "voltar" do celular fecha o modal;
 * - funciona em qualquer página pública (o host fica no PublicLayout);
 * - o link fica compartilhável.
 */
export function useQuickView() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const productId = params.get(QUICK_VIEW_PARAM)

  const open = useCallback(
    (id: string) => {
      const next = new URLSearchParams(location.search)
      next.set(QUICK_VIEW_PARAM, id)
      const alreadyOpen = Boolean((location.state as QuickViewState | null)?.quickView)
      navigate(
        { pathname: location.pathname, search: `?${next.toString()}` },
        { preventScrollReset: true, replace: alreadyOpen, state: { quickView: true } satisfies QuickViewState },
      )
    },
    [location.pathname, location.search, location.state, navigate],
  )

  const close = useCallback(() => {
    if ((location.state as QuickViewState | null)?.quickView) {
      navigate(-1)
      return
    }
    const next = new URLSearchParams(location.search)
    next.delete(QUICK_VIEW_PARAM)
    const search = next.toString()
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true, preventScrollReset: true })
  }, [location.pathname, location.search, location.state, navigate])

  return { productId, isOpen: productId !== null, open, close }
}
