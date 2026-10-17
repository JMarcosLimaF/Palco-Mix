import { AnimatePresence, m } from 'motion/react'
import { Outlet, ScrollRestoration, useNavigation } from 'react-router'
import { LogoMark } from '@/components/brand/logo'

/**
 * Carga "nova" (link externo/URL digitada) começa no topo, como no navegador;
 * F5 e voltar/avançar continuam restaurando a rolagem salva pelo React Router.
 */
function forgetScrollOnFreshLoad() {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav?.type !== 'navigate') return
    const STORAGE_KEY = 'react-router-scroll-positions' // chave usada pelo <ScrollRestoration>
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, number>
    delete saved[window.location.pathname + window.location.search]
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  } catch {
    /* storage indisponível: sem restauração, sem problema */
  }
}
forgetScrollOnFreshLoad()

/** Barra de progresso fina no topo durante navegações (rotas lazy). */
function NavigationProgress() {
  const navigation = useNavigation()
  const busy = navigation.state !== 'idle'
  return (
    <AnimatePresence>
      {busy && (
        <m.div
          key="nav-progress"
          className="fixed inset-x-0 top-0 z-[100] h-0.5 origin-left bg-brand-gradient"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 0.85, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.25 } }}
        />
      )}
    </AnimatePresence>
  )
}

export function RootLayout() {
  return (
    <>
      <NavigationProgress />
      <Outlet />
      {/*
        Entradas iniciais do histórico (carga direta/F5) têm key "default" para
        qualquer URL — sem isso, abrir /catalogo herdaria a rolagem da Home.
      */}
      <ScrollRestoration
        getKey={(location) => (location.key === 'default' ? location.pathname + location.search : location.key)}
      />
    </>
  )
}

/** Tela exibida enquanto a primeira rota lazy carrega. */
export function AppBootFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg">
      <LogoMark className="h-10 animate-pulse text-fg" />
    </div>
  )
}
