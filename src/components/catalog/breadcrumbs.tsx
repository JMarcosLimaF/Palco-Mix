import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  /** sem `to` = página atual */
  to?: string
}

/** Trilha de navegação (Início / Catálogo / …). */
export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Trilha de navegação" className={cn('min-w-0', className)}>
      <ol className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className={cn('flex items-center gap-1.5', !item.to ? 'min-w-0' : 'shrink-0')}>
            {i > 0 && <ChevronRight className="size-3 shrink-0 text-subtle" aria-hidden />}
            {item.to ? (
              <Link to={item.to} className="rounded-sm transition-colors hover:text-fg">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate font-semibold text-fg">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
