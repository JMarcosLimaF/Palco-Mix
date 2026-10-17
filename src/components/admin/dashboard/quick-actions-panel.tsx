import { ArrowUpRight, Plus, Store, Tags, Truck, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Panel, PanelHeader } from '@/components/admin/ui'
import { cn } from '@/lib/utils'

interface QuickAction {
  label: string
  hint: string
  icon: LucideIcon
  to: string
  /** abre em nova aba (vitrine pública) */
  external?: boolean
  primary?: boolean
}

const ACTIONS: QuickAction[] = [
  { label: 'Novo produto', hint: 'Cadastrar no catálogo', icon: Plus, to: '/admin/produtos/novo', primary: true },
  { label: 'Nova categoria', hint: 'Organizar a vitrine', icon: Tags, to: '/admin/categorias?novo=1' },
  { label: 'Novo distribuidor', hint: 'Marcas e fornecedores', icon: Truck, to: '/admin/distribuidores?novo=1' },
  { label: 'Ver loja', hint: 'Abre em nova aba', icon: Store, to: '/', external: true },
]

const tile =
  'group/action relative flex h-full min-h-[6.5rem] flex-col justify-between gap-3 rounded-xl border p-3.5 outline-offset-2 ' +
  'transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out-expo hover:-translate-y-0.5 active:translate-y-0'

function TileContent({ action }: { action: QuickAction }) {
  const Icon = action.icon
  return (
    <>
      <span className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-lg transition-transform duration-300 ease-out-expo group-hover/action:scale-105',
            action.primary ? 'bg-white/15 text-white' : 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
          )}
        >
          <Icon className="size-[1.1rem]" aria-hidden />
        </span>
        {action.external && (
          <ArrowUpRight
            className="size-4 text-subtle transition-transform duration-300 ease-out-expo group-hover/action:translate-x-0.5 group-hover/action:-translate-y-0.5"
            aria-hidden
          />
        )}
      </span>
      <span className="block min-w-0">
        <span className={cn('block truncate text-sm font-bold', action.primary ? 'text-white' : 'text-fg')}>
          {action.label}
        </span>
        <span className={cn('mt-0.5 block truncate text-xs', action.primary ? 'text-white/75' : 'text-muted')}>
          {action.hint}
          {action.external && <span className="sr-only"> (nova aba)</span>}
        </span>
      </span>
    </>
  )
}

/** Atalhos para as tarefas mais comuns do dia a dia. */
export function QuickActionsPanel({ className }: { className?: string }) {
  return (
    <Panel className={cn('flex flex-col', className)}>
      <PanelHeader title="Ações rápidas" description="Atalhos para o dia a dia" />
      <ul className="grid flex-1 auto-rows-fr grid-cols-2 gap-3 p-4 sm:p-5">
        {ACTIONS.map((action) => {
          const classes = cn(
            tile,
            action.primary
              ? 'border-transparent bg-brand-gradient shadow-[0_10px_30px_-14px_rgb(0_102_255/0.8)] hover:shadow-glow'
              : 'border-line bg-surface/60 hover:border-brand-500/30 hover:bg-brand-500/[0.04] hover:shadow-card',
          )
          return (
            <li key={action.label}>
              {action.external ? (
                <a href={action.to} target="_blank" rel="noopener noreferrer" className={classes}>
                  <TileContent action={action} />
                </a>
              ) : (
                <Link to={action.to} className={classes}>
                  <TileContent action={action} />
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

/**
 * Celular: os mesmos atalhos numa faixa com rolagem lateral logo abaixo da saudação
 * (o painel completo fica no fim da página). O cartão cortado na borda indica que há mais.
 */
export function QuickActionsRail({ className }: { className?: string }) {
  return (
    <nav aria-label="Ações rápidas" className={className}>
      <ul className="scrollbar-none relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 py-1">
        {ACTIONS.map((action) => {
          const Icon = action.icon
          const classes = cn(
            'group/action relative flex h-full min-h-[6.25rem] w-[8.75rem] flex-col justify-between gap-2.5 rounded-2xl border p-3 outline-offset-2',
            'transition-[transform,background-color,border-color] duration-200 ease-out-expo active:scale-[0.97]',
            action.primary
              ? 'border-transparent bg-brand-gradient text-white shadow-[0_10px_24px_-14px_rgb(0_102_255/0.85)]'
              : 'border-line bg-elevated shadow-card',
          )
          const content = (
            <>
              <span className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    'inline-flex size-9 items-center justify-center rounded-xl',
                    action.primary ? 'bg-white/15 text-white' : 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
                  )}
                >
                  <Icon className="size-[1.1rem]" aria-hidden />
                </span>
                {action.external && <ArrowUpRight className="size-4 text-subtle" aria-hidden />}
              </span>
              <span className="block min-w-0">
                <span className={cn('block text-[0.8125rem] leading-tight font-bold', action.primary ? 'text-white' : 'text-fg')}>
                  {action.label}
                </span>
                <span
                  className={cn('mt-0.5 line-clamp-2 block text-xs leading-snug', action.primary ? 'text-white/75' : 'text-muted')}
                >
                  {action.hint}
                  {action.external && <span className="sr-only"> (nova aba)</span>}
                </span>
              </span>
            </>
          )
          return (
            <li key={action.label} className="shrink-0 snap-start">
              {action.external ? (
                <a href={action.to} target="_blank" rel="noopener noreferrer" className={classes}>
                  {content}
                </a>
              ) : (
                <Link to={action.to} className={classes}>
                  {content}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
