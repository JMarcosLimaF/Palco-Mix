import { TriangleAlert } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { isSessionActive, useAuthStore } from '@/store/auth'

/**
 * Protege rotas do painel: sem sessão válida → /admin (login), preservando o destino.
 * Se a sessão vence com a página aberta, a página continua montada (ex.: formulário
 * não salvo) com um aviso; a próxima navegação leva ao login.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const expiresAt = useAuthStore((s) => s.expiresAt)
  const refresh = useAuthStore((s) => s.refresh)
  const location = useLocation()
  const path = location.pathname
  // validade conferida no render: o store pode guardar um usuário já vencido
  const valid = user !== null && isSessionActive(expiresAt)

  // venceu sem trocar de página → mantém a tela; qualquer navegação encerra a tolerância
  const [guard, setGuard] = useState({ valid, path, keep: false })
  let keep = guard.keep
  if (guard.valid !== valid || guard.path !== path) {
    keep = !valid && guard.path === path && (guard.valid || guard.keep)
    setGuard({ valid, path, keep })
  }

  // revalida a expiração (refresh limpa o usuário se expirou) a cada navegação e ao focar a janela
  useEffect(() => {
    refresh()
  }, [path, refresh])
  useEffect(() => {
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [refresh])

  const from = path + location.search
  if (!valid && !keep) {
    return <Navigate to="/admin" replace state={{ from }} />
  }
  return (
    <>
      {children}
      {!valid && <SessionExpiredNotice from={from} />}
    </>
  )
}

/**
 * Aviso fixo de sessão vencida. A saída passa pelo router (respeita bloqueios de formulário).
 * No celular fica no topo para não cobrir a barra "Salvar" do formulário.
 */
function SessionExpiredNotice({ from }: { from: string }) {
  const navigate = useNavigate()
  return (
    <div
      role="alert"
      className="fixed inset-x-4 top-20 z-40 mx-auto flex max-w-xl sm:top-auto sm:bottom-4 flex-col gap-3 rounded-2xl border border-amber-500/30 bg-elevated p-4 shadow-pop sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <p className="text-sm leading-relaxed text-muted">
          <span className="font-bold text-fg">Sua sessão expirou.</span> Salve ou copie o que estiver editando e
          entre de novo para continuar.
        </p>
      </div>
      <Button size="sm" className="shrink-0 max-sm:h-11" onClick={() => void navigate('/admin', { state: { from } })}>
        Entrar de novo
      </Button>
    </div>
  )
}
