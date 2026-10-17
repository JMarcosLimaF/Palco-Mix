import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CatalogPagerProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  className?: string
}

const BUTTON =
  'inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full border border-line-strong text-sm font-semibold text-fg ' +
  'transition-[background-color,border-color,transform,opacity] duration-200 ease-out-expo active:scale-[0.97] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ' +
  'aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:active:scale-100'

/**
 * Paginação do celular: "Anterior" e "Próxima" grandes (zona do polegar) com a
 * página atual no meio. A partir de `sm` a vitrine usa a `Pagination` numerada.
 */
export function CatalogPager({ page, pageCount, onPageChange, className }: CatalogPagerProps) {
  if (pageCount <= 1) return null
  // aria-disabled (e não disabled): o botão acionado continua focável na 1ª/última página
  const atStart = page <= 1
  const atEnd = page >= pageCount

  return (
    <nav aria-label="Paginação" className={cn('flex items-center gap-3', className)}>
      <button
        type="button"
        className={cn(BUTTON, !atStart && 'hover:bg-surface-2')}
        onClick={() => {
          if (!atStart) onPageChange(page - 1)
        }}
        aria-disabled={atStart || undefined}
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Anterior
      </button>
      <p className="shrink-0 px-1 text-center text-xs leading-tight text-muted tabular-nums">
        Página
        <span className="block text-sm font-bold text-fg">
          {page} de {pageCount}
        </span>
      </p>
      <button
        type="button"
        className={cn(BUTTON, !atEnd && 'border-fg bg-fg text-bg hover:bg-ink-800 dark:hover:bg-white/90')}
        onClick={() => {
          if (!atEnd) onPageChange(page + 1)
        }}
        aria-disabled={atEnd || undefined}
        aria-label="Próxima página"
      >
        Próxima
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  )
}
