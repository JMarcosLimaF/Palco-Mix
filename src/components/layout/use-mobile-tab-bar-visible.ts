import { useLocation } from 'react-router'
import { useProduct } from '@/hooks/catalog'
import { productIdFromPath } from './nav-config'

/**
 * A barra inferior do celular aparece em toda a vitrine, exceto quando a página do
 * produto mostra de fato a própria barra fixa de compra (produto ativo carregado).
 * Produto inexistente, inativo ou com erro mantém a navegação fixa (sem beco sem saída).
 * Mesma consulta da página do produto (cache do TanStack Query — nada é buscado duas vezes).
 */
export function useMobileTabBarVisible(): boolean {
  const { pathname } = useLocation()
  const id = productIdFromPath(pathname)
  const { data, isPending } = useProduct(id)
  if (!id) return true
  // carregando: sem barra (evita a troca barra inferior → barra de compra)
  return !isPending && data?.status !== 'active'
}
