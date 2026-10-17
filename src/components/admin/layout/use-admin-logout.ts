import { useCallback } from 'react'
import { useNavigate } from 'react-router'

/** Estado de navegação que pede ao login (/admin) para encerrar a sessão. */
const LOGGED_OUT_STATE = { loggedOut: true } as const

export function isLoggedOutState(state: unknown): boolean {
  return typeof state === 'object' && state !== null && (state as { loggedOut?: unknown }).loggedOut === true
}

/**
 * "Sair": só navega para o login, que encerra a sessão e mostra o toast (LoginPage).
 * Assim a saída passa pelos bloqueios de navegação (ex.: formulário com alterações
 * não salvas pergunta antes) e só desloga se a pessoa confirmar.
 */
export function useAdminLogout() {
  const navigate = useNavigate()
  return useCallback(() => {
    void navigate('/admin', { replace: true, state: LOGGED_OUT_STATE })
  }, [navigate])
}
