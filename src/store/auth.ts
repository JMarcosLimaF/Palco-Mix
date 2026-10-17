/**
 * Sessão do painel. Carregado só pelas rotas lazy do admin (fora do bundle público).
 * Revalida sozinho no vencimento (timer) e quando outra aba entra/sai (evento `storage`).
 */
import { create } from 'zustand'
import { authService, SESSION_KEY, type AdminUser } from '@/services/auth'

interface AuthState {
  user: AdminUser | null
  expiresAt: number | null
  login: (username: string, password: string, remember?: boolean) => Promise<void>
  logout: () => void
  /** Revalida a sessão (expiração) — chamado ao focar a janela/navegar no admin. */
  refresh: () => void
}

const initial = authService.getSession()

export const useAuthStore = create<AuthState>()((set, get) => ({
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
    const current = get()
    // mesma sessão: evita trocar a referência do usuário (re-render de todo o painel)
    if (current.user?.username === session?.user.username && current.expiresAt === (session?.expiresAt ?? null)) return
    set({ user: session?.user ?? null, expiresAt: session?.expiresAt ?? null })
  },
}))

/**
 * A sessão ainda vale agora? Use no render junto com `user`: o store pode guardar
 * um usuário vencido até o próximo `refresh` (ex.: aba suspensa).
 */
export function isSessionActive(expiresAt: number | null): boolean {
  return expiresAt !== null && expiresAt > Date.now()
}

// ------------------------------------------------------------------ revalidação automática

/** Maior atraso aceito por setTimeout (~24,8 dias). */
const MAX_TIMEOUT_MS = 2 ** 31 - 1
let expiryTimer: ReturnType<typeof setTimeout> | undefined

function scheduleExpiry(expiresAt: number | null) {
  clearTimeout(expiryTimer)
  if (expiresAt === null) return
  const delay = Math.min(Math.max(0, expiresAt - Date.now()) + 50, MAX_TIMEOUT_MS)
  expiryTimer = setTimeout(() => {
    useAuthStore.getState().refresh()
    scheduleExpiry(useAuthStore.getState().expiresAt)
  }, delay)
}

if (typeof window !== 'undefined') {
  scheduleExpiry(useAuthStore.getState().expiresAt)
  useAuthStore.subscribe((state, prev) => {
    if (state.expiresAt !== prev.expiresAt) scheduleExpiry(state.expiresAt)
  })
  // login/logout persistente feito em outra aba (key null = storage limpo)
  window.addEventListener('storage', (event) => {
    if (event.key === SESSION_KEY || event.key === null) useAuthStore.getState().refresh()
  })
}

export const useIsAuthenticated = () => useAuthStore((s) => s.user !== null)
