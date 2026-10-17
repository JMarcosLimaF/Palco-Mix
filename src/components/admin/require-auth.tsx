import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuthStore } from '@/store/auth'

/** Protege rotas do painel: sem sessão válida → /admin (login), preservando o destino. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const refresh = useAuthStore((s) => s.refresh)
  const location = useLocation()

  // revalida a expiração (refresh limpa o usuário se expirou) a cada navegação e ao focar a janela
  useEffect(() => {
    refresh()
  }, [location.pathname, refresh])
  useEffect(() => {
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [refresh])

  if (!user) {
    return <Navigate to="/admin" replace state={{ from: location.pathname + location.search }} />
  }
  return <>{children}</>
}
