/**
 * /admin — login do painel.
 * Desktop: painel de marca escuro à esquerda + formulário à direita.
 * Mobile: só o cartão do formulário com o selo da marca no topo.
 */
import { ArrowLeft, ArrowRight, CircleAlert, Eye, EyeOff, KeyRound, LockKeyhole } from 'lucide-react'
import { AnimatePresence, m, useAnimationControls, useReducedMotion } from 'motion/react'
import { useId, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { firstName } from '@/components/admin/layout/admin-nav-items'
import { isLoggedOutState } from '@/components/admin/layout/use-admin-logout'
import { LogoBadge } from '@/components/brand/logo'
import { ProductImage } from '@/components/catalog/product-image'
import { Button } from '@/components/ui/button'
import { Checkbox, Input } from '@/components/ui/form'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { site } from '@/config/site'
import { useFeaturedProducts } from '@/hooks/catalog'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { listLibraryImages } from '@/lib/images'
import { cn } from '@/lib/utils'
import { errorMessage } from '@/services/errors'
import { isSessionActive, useAuthStore } from '@/store/auth'

const EASE = [0.16, 1, 0.3, 1] as const

/** Só aceita destinos internos do painel (evita redirecionamento aberto). */
function safeRedirect(from: unknown): string {
  return typeof from === 'string' && from.startsWith('/admin/') ? from : '/admin/painel'
}

export default function LoginPage() {
  useDocumentTitle('Entrar · Admin')
  const user = useAuthStore((s) => s.user)
  const expiresAt = useAuthStore((s) => s.expiresAt)
  const location = useLocation()
  const navigate = useNavigate()
  const destination = safeRedirect((location.state as { from?: unknown } | null)?.from)
  // durante o login a tela continua visível (botão "Entrando…") até o painel carregar
  const [entering, setEntering] = useState(false)
  // "Sair" chega aqui pela navegação (useAdminLogout): só desloga depois de passar pelos bloqueios de saída
  const loggedOut = isLoggedOutState(location.state)

  useLayoutEffect(() => {
    if (!loggedOut) return
    useAuthStore.getState().logout()
    // id fixo: o StrictMode roda o efeito duas vezes, mas o toast aparece uma só
    toast.success('Você saiu do painel.', { id: 'admin-logout', description: 'Até a próxima!' })
    void navigate(location.pathname, { replace: true, state: null })
  }, [loggedOut, navigate, location.pathname])

  // já autenticado (sessão ainda válida) ao abrir /admin → segue direto para o destino
  if (user && isSessionActive(expiresAt) && !entering && !loggedOut) return <Navigate to={destination} replace />

  return (
    <div className="grid min-h-dvh bg-bg text-fg lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
      <BrandPanel />

      <div className="relative flex min-h-dvh flex-col overflow-hidden">
        {/* brilho azul sutil (mobile/tablet) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(55%_60%_at_50%_0%,rgb(0_102_255/0.16),transparent_75%)] lg:hidden"
        />

        <div className="relative flex items-center justify-between gap-3 p-4 sm:p-6">
          <Link
            to="/"
            className="group/back inline-flex h-10 items-center gap-1.5 rounded-full pr-3 pl-2 text-sm font-semibold text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-fg"
          >
            <ArrowLeft
              className="size-4 transition-transform duration-300 ease-out-expo group-hover/back:-translate-x-0.5"
              aria-hidden
            />
            Voltar para a loja
          </Link>
          <ThemeToggle />
        </div>

        <main className="relative flex flex-1 items-center justify-center px-4 pt-2 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-12">
          <div className="w-full max-w-[25rem]">
            <m.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mb-6 flex justify-center sm:mb-7 lg:hidden"
            >
              <LogoBadge size={88} />
            </m.div>
            <LoginCard
              onStart={() => setEntering(true)}
              onDone={(ok) => {
                if (ok) void navigate(destination, { replace: true })
                else setEntering(false)
              }}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ painel da marca

function BrandPanel() {
  const featured = useFeaturedProducts(4)
  const images = useMemo(() => {
    if (!featured.data) return []
    const fromFeatured = featured.data.map((p) => p.images[0]).filter((path): path is string => Boolean(path))
    const fill = listLibraryImages().filter((path) => !fromFeatured.includes(path))
    return [...fromFeatured, ...fill].slice(0, 4)
  }, [featured.data])

  return (
    <div className="relative hidden overflow-hidden border-r border-white/[0.06] bg-ink-950 text-white lg:flex lg:flex-col">
      {/* mosaico desfocado de artes reais (decorativo) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 -right-28 grid w-[40rem] -translate-y-1/2 rotate-[-9deg] grid-cols-2 gap-5 opacity-45 blur-[3px] xl:-right-16">
          {images.map((path, i) => (
            <div
              key={path}
              className={cn(
                'relative aspect-[5/6] overflow-hidden rounded-3xl bg-ink-850 ring-1 ring-white/10',
                i % 2 === 1 && 'translate-y-20',
              )}
            >
              <ProductImage path={path} alt="" sizes="320px" fit="cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-linear-to-r from-ink-950 via-ink-950/90 to-ink-950/25" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-ink-950 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-ink-950/80 to-transparent" />
        <div className="absolute -top-40 -left-32 size-[34rem] rounded-full bg-[radial-gradient(closest-side,rgb(0_102_255/0.42),transparent)]" />
        <div className="absolute -bottom-48 left-1/3 size-[26rem] rounded-full bg-[radial-gradient(closest-side,rgb(0_82_204/0.28),transparent)]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-between gap-12 p-10 xl:p-14">
        <m.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="w-fit"
        >
          <LogoBadge size={120} />
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
          className="max-w-md"
        >
          <p className="eyebrow text-brand-300">Painel administrativo</p>
          <p className="title-display mt-4 text-5xl text-balance xl:text-6xl">
            Bastidores da <span className="text-brand-gradient pr-1">Palco Mix</span>
          </p>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-white/65">
            Cadastre produtos, organize categorias e mantenha a vitrine sempre em dia.
          </p>
        </m.div>

        <div className="flex items-center gap-3 text-xs font-medium text-white/45">
          <span className="logo-stripe h-[3px] w-10 rounded-full" aria-hidden />
          {site.fullName}
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ formulário

const SHAKE = { x: [0, -10, 9, -7, 5, -2, 0], transition: { duration: 0.46, ease: 'easeOut' as const } }

interface LoginCardProps {
  /** chamado antes de autenticar */
  onStart: () => void
  /** chamado ao final (sucesso ou falha) */
  onDone: (ok: boolean) => void
}

function LoginCard({ onStart, onDone }: LoginCardProps) {
  const login = useAuthStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // incrementa a cada falha: força o leitor de tela a reanunciar a mesma mensagem
  const [attempt, setAttempt] = useState(0)
  const controls = useAnimationControls()
  const reduceMotion = useReducedMotion()
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const id = useId()
  const errorId = `${id}-error`

  function fail(message: string, focus: 'username' | 'password') {
    setError(message)
    setAttempt((n) => n + 1)
    if (!reduceMotion) void controls.start(SHAKE)
    ;(focus === 'username' ? usernameRef : passwordRef).current?.focus()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    if (!username.trim() || !password) {
      fail('Informe usuário e senha para continuar.', username.trim() ? 'password' : 'username')
      return
    }
    setSubmitting(true)
    setError(null)
    onStart()
    try {
      await login(username, password, remember)
    } catch (err) {
      setSubmitting(false)
      setPassword('')
      onDone(false)
      fail(errorMessage(err, 'Não foi possível entrar. Tente novamente.'), 'password')
      return
    }
    const name = firstName(useAuthStore.getState().user?.name)
    toast.success(name ? `Olá, ${name}! Bom te ver por aqui.` : 'Login realizado.')
    onDone(true)
  }

  function clearError() {
    if (error) setError(null)
  }

  function fillDemo(demoUser: string, demoPassword: string) {
    setUsername(demoUser)
    setPassword(demoPassword)
    setError(null)
    submitRef.current?.focus()
  }

  const invalid = error ? true : undefined

  return (
    <>
      <m.div animate={controls}>
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
          className="rounded-3xl border border-line bg-elevated p-6 shadow-card sm:p-8"
        >
          <div className="mb-7">
            <span className="mb-5 hidden size-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 lg:inline-flex dark:text-brand-400">
              <LockKeyhole className="size-5" aria-hidden />
            </span>
            <h1 className="title-display text-[2rem] text-fg">Entrar no painel</h1>
            <p className="mt-2 text-sm text-muted">Acesso restrito à equipe da {site.name}.</p>
          </div>

          <AnimatePresence initial={false}>
            {error && (
              <m.div
                key="login-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="overflow-hidden"
              >
                <div
                  id={errorId}
                  role="alert"
                  className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-3.5 py-3 text-sm font-medium text-red-700 dark:text-red-300"
                >
                  <CircleAlert className="mt-px size-4 shrink-0" aria-hidden />
                  <p key={attempt}>{error}</p>
                </div>
              </m.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-user`} className="text-sm font-semibold text-fg">
                Usuário
              </label>
              <Input
                ref={usernameRef}
                id={`${id}-user`}
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                required
                readOnly={submitting}
                placeholder="seu.usuario"
                enterKeyHint="next"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  clearError()
                }}
                onKeyDown={(e) => {
                  // "Seguinte" do teclado do celular (ou Enter): vai para a senha em vez de acusar erro
                  if (e.key === 'Enter' && username.trim() && !password) {
                    e.preventDefault()
                    passwordRef.current?.focus()
                  }
                }}
                aria-invalid={invalid}
                aria-describedby={error ? errorId : undefined}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-pass`} className="text-sm font-semibold text-fg">
                Senha
              </label>
              <div className="relative">
                <Input
                  ref={passwordRef}
                  id={`${id}-pass`}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  readOnly={submitting}
                  placeholder="••••••"
                  enterKeyHint="go"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearError()
                  }}
                  aria-invalid={invalid}
                  aria-describedby={error ? errorId : undefined}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-label="Mostrar senha"
                  aria-controls={`${id}-pass`}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute top-1/2 right-0 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-xl text-subtle transition-colors duration-200 hover:bg-surface-2 hover:text-fg sm:right-1 sm:size-9 sm:rounded-lg"
                >
                  {showPassword ? (
                    <EyeOff className="size-[1.1rem]" aria-hidden />
                  ) : (
                    <Eye className="size-[1.1rem]" aria-hidden />
                  )}
                </button>
              </div>
            </div>

            <Checkbox
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              label="Manter conectado por 7 dias"
              // celular: a linha inteira (44px) marca a opção
              className="-my-2.5 min-h-11 sm:-my-0.5 sm:min-h-0"
            />

            <Button ref={submitRef} type="submit" size="lg" loading={submitting} className="mt-1 w-full">
              {submitting ? 'Entrando…' : 'Entrar'}
              {!submitting && <ArrowRight aria-hidden />}
            </Button>
          </form>
        </m.div>
      </m.div>
      {import.meta.env.DEV && <DemoCredentialsHint onFill={fillDemo} />}
    </>
  )
}

// ------------------------------------------------------------------ dica (somente em desenvolvimento)

const DEMO_USERNAME = 'admin'
const DEMO_PASSWORD = '123456'

/** Dica com as credenciais do mock. Só existe em `import.meta.env.DEV` (removida do build de produção). */
function DemoCredentialsHint({ onFill }: { onFill: (username: string, password: string) => void }) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mt-5 flex items-center gap-3 rounded-2xl border border-dashed border-line-strong px-3.5 py-3"
    >
      <KeyRound className="size-4 shrink-0 text-brand-500" aria-hidden />
      <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted">
        <span className="font-semibold text-fg">Demonstração</span> · usuário{' '}
        <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.7rem] text-fg">{DEMO_USERNAME}</code> ·
        senha <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.7rem] text-fg">{DEMO_PASSWORD}</code>
      </p>
      <Button
        variant="subtle"
        size="xs"
        className="max-sm:h-10 max-sm:px-4"
        onClick={() => onFill(DEMO_USERNAME, DEMO_PASSWORD)}
      >
        Preencher
      </Button>
    </m.div>
  )
}
