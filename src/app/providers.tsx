import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { LazyMotion, MotionConfig } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { localDb } from '@/lib/db/local-db'
import { catalogKeys } from '@/hooks/catalog'
import { applyTheme, useResolvedTheme } from '@/store/theme'

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
  const theme = useResolvedTheme()
  useEffect(() => applyTheme(theme), [theme])
  return null
}

/** Toasts no tema efetivo — isolado para a troca de tema não re-renderizar os providers. */
function AppToaster() {
  const theme = useResolvedTheme()
  return <Toaster theme={theme} position="top-center" richColors closeButton toastOptions={{ className: 'font-sans' }} />
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <CatalogSync />
        <ThemeSync />
        {children}
        <AppToaster />
      </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  )
}
