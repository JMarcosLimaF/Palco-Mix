import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { LazyMotion, MotionConfig } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { localDb } from '@/lib/db/local-db'
import { catalogKeys } from '@/hooks/catalog'
import { applyTheme, resolveTheme, useThemeStore } from '@/store/theme'

const loadMotionFeatures = () => import('./motion-features').then((mod) => mod.default)

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // dados locais: só mudam por escrita (que invalida via CatalogSync)
        staleTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: { retry: 0 },
    },
  })
}

/** Invalida o cache sempre que o banco local muda (nesta ou em outra aba). */
function CatalogSync() {
  const queryClient = useQueryClient()
  useEffect(
    () => localDb.subscribe(() => void queryClient.invalidateQueries({ queryKey: catalogKeys.all })),
    [queryClient],
  )
  return null
}

/** Mantém a classe .dark sincronizada com a preferência (e com o SO no modo "system"). */
function ThemeSync() {
  const mode = useThemeStore((s) => s.mode)
  useEffect(() => {
    applyTheme(mode)
    if (mode !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [mode])
  return null
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  const mode = useThemeStore((s) => s.mode)
  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <CatalogSync />
        <ThemeSync />
        {children}
        <Toaster
          theme={resolveTheme(mode)}
          position="top-center"
          richColors
          closeButton
          toastOptions={{ className: 'font-sans' }}
        />
      </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  )
}
