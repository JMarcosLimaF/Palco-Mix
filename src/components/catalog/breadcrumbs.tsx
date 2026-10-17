import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  /** sem `to` = página atual */
  to?: string
}

/**
 * Trilha de navegação (Início / Catálogo / …).
 * No celular vira um único link "← Nível anterior" com alvo de toque de 40px
 * (a margem negativa mantém a altura visual de uma linha de texto).
 */
export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  // último nível com link (o "voltar" da versão compacta)
  const parent = [...items].reverse().find((item) => item.to)

  return (
    <nav aria-label="Trilha de navegação" className={cn('min-w-0', className)}>
      {parent?.to && (
        <Link
          to={parent.to}
          className="-my-2.5 -ml-2 inline-flex h-10 max-w-full items-center gap-1 rounded-full pr-3 pl-1.5 text-[0.8125rem] font-semibold text-muted transition-colors hover:text-fg active:bg-surface-2 sm:hidden"
        >
          <ChevronLeft className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{parent.label}</span>
        </Link>
      )}
      <ol className={cn('min-w-0 items-center gap-1.5 text-xs font-medium text-muted', parent ? 'hidden sm:flex' : 'flex')}>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className={cn('flex items-center gap-1.5', !item.to ? 'min-w-0' : 'shrink-0')}>
            {i > 0 && <ChevronRight className="size-3 shrink-0 text-subtle" aria-hidden />}
            {item.to ? (
              // alvo de 40px em telas de toque maiores (tablet) sem mudar a altura da linha
              <Link to={item.to} className="-my-3 inline-flex min-h-10 items-center rounded-sm transition-colors hover:text-fg">
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
