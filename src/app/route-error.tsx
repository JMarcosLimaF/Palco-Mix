import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { LogoMark } from '@/components/brand/logo'
import { buttonVariants } from '@/components/ui/button-variants'

/** Fallback para erros inesperados de renderização/carregamento de rota. */
export function RouteErrorBoundary() {
  const error = useRouteError()
  const isChunkError = error instanceof Error && /dynamically imported module|Failed to fetch/i.test(error.message)
  const title = isRouteErrorResponse(error) ? `${error.status} · ${error.statusText}` : 'Algo saiu do palco'
  const message = isChunkError
    ? 'Uma nova versão do site foi publicada. Recarregue a página para continuar.'
    : 'Ocorreu um erro inesperado. Tente recarregar a página.'

  if (import.meta.env.DEV) console.error(error)

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-bg px-6 text-center">
      <LogoMark className="h-12 text-fg" />
      <h1 className="title-display text-3xl text-fg">{title}</h1>
      <p className="max-w-md text-muted">{message}</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => window.location.reload()} className={buttonVariants()}>
          Recarregar
        </button>
        <Link to="/" className={buttonVariants({ variant: 'outline' })}>
          Ir para o início
        </Link>
      </div>
    </main>
  )
}
