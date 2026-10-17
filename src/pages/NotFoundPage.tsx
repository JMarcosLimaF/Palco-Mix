import { ArrowLeft, LayoutGrid } from 'lucide-react'
import { m } from 'motion/react'
import { Link } from 'react-router'
import { LogoMark } from '@/components/brand/logo'
import { buttonVariants } from '@/components/ui/button-variants'
import { useDocumentTitle } from '@/hooks/use-document-title'

const EASE = [0.16, 1, 0.3, 1] as const

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE, delay } },
})

export default function NotFoundPage() {
  useDocumentTitle('Página não encontrada')

  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(48rem_26rem_at_50%_-4%,rgb(0_102_255/0.12),transparent_70%)]"
      />
      <LogoMark className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[min(70vw,34rem)] -translate-x-1/2 -translate-y-1/2 text-fg opacity-[0.035]" />

      <div className="container-page flex min-h-[calc(100dvh-16rem)] flex-col items-center justify-center py-10 text-center sm:py-24">
        <m.span
          {...rise(0)}
          className="eyebrow inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1.5 text-brand-700 dark:text-brand-300"
        >
          <LogoMark className="h-3 text-current" />
          Erro 404
        </m.span>

        <m.h1 {...rise(0.06)} className="mt-6">
          <span
            aria-hidden
            className="title-display text-brand-gradient block pr-[0.08em] text-[clamp(7.5rem,30vw,15rem)] leading-[0.9] select-none"
          >
            404
          </span>
          <span className="sr-only">Página não encontrada</span>
        </m.h1>

        <m.p {...rise(0.12)} className="title-display mt-4 text-2xl text-fg sm:text-3xl">
          Essa página saiu de cena…
        </m.p>
        <m.p {...rise(0.16)} className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
          A página que você procurou não existe ou mudou de endereço. Mas o palco continua montado: volte ao início ou
          explore o catálogo.
        </m.p>

        <m.div {...rise(0.22)} className="mt-7 flex w-full flex-col gap-3 sm:mt-9 sm:w-auto sm:flex-row">
          <Link to="/" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
            <ArrowLeft aria-hidden />
            Voltar ao início
          </Link>
          <Link to="/catalogo" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            <LayoutGrid aria-hidden />
            Ver catálogo
          </Link>
        </m.div>

        <m.p {...rise(0.3)} className="mt-10 hidden text-xs text-subtle md:block">
          Dica: pressione{' '}
          <kbd className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-surface px-1 font-sans text-[0.6875rem] font-semibold text-muted">
            /
          </kbd>{' '}
          para buscar um produto.
        </m.p>
      </div>
    </section>
  )
}
