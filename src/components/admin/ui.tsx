/**
 * Primitivas visuais do painel admin (compartilhadas entre as telas).
 */
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface AdminPageHeaderProps {
  title: ReactNode
  description?: ReactNode
  /** ações à direita (ex: botão "Novo produto") */
  actions?: ReactNode
  /** linha acima do título (ex: breadcrumb/voltar) */
  eyebrow?: ReactNode
  /** classes extras do contêiner das ações (ex.: `max-sm:hidden` quando o celular tem outro atalho) */
  actionsClassName?: string
}

export function AdminPageHeader({ title, description, actions, eyebrow, actionsClassName }: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-3.5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-sm text-muted">{eyebrow}</div>}
        <h1 className="title-display text-[1.75rem] text-fg sm:text-[2rem]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className={cn('flex shrink-0 flex-wrap items-center gap-2', actionsClassName)}>{actions}</div>}
    </header>
  )
}

/** Superfície/cartão padrão do admin. */
export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-line bg-elevated shadow-card', className)} {...props} />
}

export function PanelHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-base font-bold tracking-tight text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  )
}
