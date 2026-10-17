/**
 * Autenticação MOCK do painel administrativo.
 *
 * ⚠️ Apenas para desenvolvimento/demonstração: as credenciais ficam no
 * bundle do navegador e não oferecem segurança real. Em produção, troque
 * este módulo por um provedor real (ex.: Supabase Auth) mantendo a mesma API.
 *
 * Credenciais padrão: usuário `admin` · senha `123456`.
 */
import { ServiceError } from './errors'

export interface AdminUser {
  username: string
  name: string
  role: 'admin'
}

export interface Session {
  user: AdminUser
  token: string
  expiresAt: number
}

/** "Banco" de usuários do mock. */
const MOCK_USERS: Array<AdminUser & { password: string }> = [
  { username: 'admin', password: '123456', name: 'Administrador', role: 'admin' },
]

export const SESSION_KEY = 'palcomix:session'
const SESSION_HOURS = 8
const REMEMBER_DAYS = 7

function randomToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Acesso protegido ao storage: com cookies/dados de sites bloqueados, o próprio
 * getter `window.localStorage` lança SecurityError.
 */
function storage(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

/** Remove a sessão sem deixar erro de storage escapar. */
function clear(store: Storage | null) {
  try {
    store?.removeItem(SESSION_KEY)
  } catch {
    // storage indisponível: não há o que limpar
  }
}

function read(store: Storage | null): Session | null {
  if (!store) return null
  try {
    const raw = store.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    if (!session?.user || typeof session.expiresAt !== 'number' || session.expiresAt <= Date.now()) {
      store.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export const authService = {
  getSession(): Session | null {
    return read(storage('local')) ?? read(storage('session'))
  },

  async login(username: string, password: string, remember = false): Promise<Session> {
    // pequeno atraso simulando a rede e desencorajando força bruta
    await new Promise((r) => setTimeout(r, 350))
    const user = MOCK_USERS.find((u) => u.username === username.trim().toLowerCase() && u.password === password)
    if (!user) throw new ServiceError('unauthorized', 'Usuário ou senha incorretos.')

    const { password: _omit, ...publicUser } = user
    void _omit
    const ttl = remember ? REMEMBER_DAYS * 24 * 3600_000 : SESSION_HOURS * 3600_000
    const session: Session = { user: publicUser, token: randomToken(), expiresAt: Date.now() + ttl }
    const target = storage(remember ? 'local' : 'session')
    try {
      if (!target) throw new Error('storage indisponível')
      target.setItem(SESSION_KEY, JSON.stringify(session))
    } catch {
      throw new ServiceError(
        'storage',
        'Ative o armazenamento do navegador (cookies e dados de sites) para entrar no painel.',
      )
    }
    clear(storage(remember ? 'session' : 'local'))
    return session
  },

  logout(): void {
    clear(storage('local'))
    clear(storage('session'))
  },
}
