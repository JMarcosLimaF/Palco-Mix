import { create } from 'zustand'
import { authService, type AdminUser } from '@/services/auth'

interface AuthState {
  user: AdminUser | null
  expiresAt: number | null
  login: (username: string, password: string, remember?: boolean) => Promise<void>
  logout: () => void
  /** Revalida a sessão (expiração) — chamado ao focar a janela/navegar no admin. */
  refresh: () => void
}

const initial = authService.getSession()

export const useAuthStore = create<AuthState>()((set) => ({
  user: initial?.user ?? null,
  expiresAt: initial?.expiresAt ?? null,
  async login(username, password, remember) {
    const session = await authService.login(username, password, remember)
    set({ user: session.user, expiresAt: session.expiresAt })
  },
  logout() {
    authService.logout()
    set({ user: null, expiresAt: null })
  },
  refresh() {
    const session = authService.getSession()
    set({ user: session?.user ?? null, expiresAt: session?.expiresAt ?? null })
  },
}))

export const useIsAuthenticated = () => useAuthStore((s) => s.user !== null)
