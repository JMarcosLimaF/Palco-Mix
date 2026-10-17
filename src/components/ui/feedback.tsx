import { LoaderCircle, PackageSearch } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Bloco de carregamento com brilho (shimmer). */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn('skeleton rounded-xl', className)} {...props} />
}

export function Spinner({ className, label = 'Carregando' }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-sm text-muted', className)}>
      <LoaderCircle className="size-5 animate-spin text-brand-500" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export interface EmptyStateProps {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-16 text-center', className)}>
      <span className="inline-flex size-16 items-center justify-center rounded-3xl bg-surface-2 text-subtle">
        {icon ?? <PackageSearch className="size-7" aria-hidden />}
      </span>
      <h3 className="text-lg font-bold tracking-tight text-fg">{title}</h3>
      {description && <p className="max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
