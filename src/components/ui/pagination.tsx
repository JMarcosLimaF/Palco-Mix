import { ChevronLeft, ChevronRight } from 'lucide-react'
import { pageWindow } from '@/lib/pagination'
import { cn } from '@/lib/utils'

export interface PaginationProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  if (pageCount <= 1) return null
  const item =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold tabular-nums transition-colors duration-200 ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:pointer-events-none disabled:opacity-40'

  return (
    <nav aria-label="Paginação" className={cn('flex items-center justify-center gap-1', className)}>
      <button
        type="button"
        className={cn(item, 'gap-1 text-fg hover:bg-surface-2')}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-4" aria-hidden />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      <span className="px-3 text-sm text-muted tabular-nums sm:hidden">
        {page} / {pageCount}
      </span>

      <ul className="hidden items-center gap-1 sm:flex">
        {pageWindow(page, pageCount).map((p, i) =>
          p === 'gap' ? (
            <li key={`gap-${i}`} className="px-1 text-subtle" aria-hidden>
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Página ${p}`}
                className={cn(item, p === page ? 'bg-fg text-bg' : 'text-muted hover:bg-surface-2 hover:text-fg')}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        className={cn(item, 'gap-1 text-fg hover:bg-surface-2')}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Próxima página"
      >
        <span className="hidden sm:inline">Próxima</span>
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  )
}
