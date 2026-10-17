import { ArrowRight } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { Panel, PanelHeader } from '@/components/admin/ui'
import { Skeleton } from '@/components/ui/feedback'
import { cn, pluralize } from '@/lib/utils'
import { barRatio, formatCount, formatShare } from './dashboard-utils'

const EASE = [0.16, 1, 0.3, 1] as const

export interface BarListItem {
  id: string
  name: string
  count: number
}

export interface BarListPanelProps {
  title: string
  /** itens já ordenados do maior para o menor */
  items: BarListItem[] | undefined
  /** total de produtos (base do percentual) */
  total: number
  loading?: boolean
  limit?: number
  /** link "Gerenciar" no cabeçalho */
  manageHref: string
  /** ex.: { singular: 'categoria', plural: 'categorias' } */
  noun: { singular: string; plural: string }
  /** link de cada linha (ex.: lista de produtos filtrada) */
  itemHref: (id: string) => string
  className?: string
}

/** Ranking em barras horizontais (CSS puro), top N com contagem e percentual. */
export function BarListPanel({
  title,
  items,
  total,
  loading = false,
  limit = 8,
  manageHref,
  noun,
  itemHref,
  className,
}: BarListPanelProps) {
  const reduceMotion = useReducedMotion()
  const { top, rest, max } = useMemo(() => {
    const withProducts = (items ?? []).filter((i) => i.count > 0)
    const topItems = withProducts.slice(0, limit)
    const remaining = withProducts.slice(limit)
    return {
      top: topItems,
      rest: { groups: remaining.length, count: remaining.reduce((sum, i) => sum + i.count, 0) },
      max: topItems[0]?.count ?? 0,
    }
  }, [items, limit])

  return (
    <Panel className={cn('flex flex-col', className)}>
      <PanelHeader
        title={title}
        description={
          loading
            ? 'Carregando…'
            : `${pluralize(total, 'produto', 'produtos')} em ${pluralize(items?.length ?? 0, noun.singular, noun.plural)}`
        }
        actions={
          <Link
            to={manageHref}
            className="group/manage inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-semibold text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-fg"
          >
            Gerenciar
            <ArrowRight
              className="size-3.5 transition-transform duration-300 ease-out-expo group-hover/manage:translate-x-0.5"
              aria-hidden
            />
          </Link>
        }
      />

      <div className="flex-1 px-3 py-3">
        {loading ? (
          <ul className="space-y-4 px-2 py-1" aria-hidden>
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="space-y-2">
                <div className="flex justify-between gap-4">
                  <Skeleton className="h-3.5 rounded-md" style={{ width: `${55 - i * 5}%` }} />
                  <Skeleton className="h-3.5 w-14 rounded-md" />
                </div>
                <Skeleton className="h-2 rounded-full" />
              </li>
            ))}
          </ul>
        ) : top.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Nenhum produto cadastrado ainda.</p>
        ) : (
          <ol className="space-y-0.5">
            {top.map((item, i) => {
              const ratio = barRatio(item.count, max)
              return (
                <li key={item.id}>
                  <Link
                    to={itemHref(item.id)}
                    className="group/bar block rounded-xl px-2 py-2 transition-colors duration-200 hover:bg-surface"
                  >
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <span
                        className="min-w-0 truncate font-semibold text-fg transition-colors duration-200 group-hover/bar:text-brand-600 dark:group-hover/bar:text-brand-300"
                        title={item.name}
                      >
                        <span className="sr-only">Ver produtos de </span>
                        {item.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted tabular-nums">
                        <strong className="font-bold text-fg">{formatCount(item.count)}</strong>
                        <span className="ml-1.5 inline-block min-w-[2.25rem] text-right text-subtle">
                          {formatShare(item.count, total)}
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                      <m.div
                        className={cn(
                          'h-full rounded-full',
                          i === 0 ? 'bg-brand-gradient' : 'bg-brand-500/70 dark:bg-brand-400/70',
                        )}
                        initial={reduceMotion ? false : { width: 0 }}
                        animate={{ width: `${ratio * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.1 + i * 0.05, ease: EASE }}
                      />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {!loading && rest.groups > 0 && (
        <p className="border-t border-line px-5 py-3 text-xs text-muted">
          + {formatCount(rest.groups)} {rest.groups === 1 ? noun.singular : noun.plural} com {formatCount(rest.count)}{' '}
          {rest.count === 1 ? 'produto' : 'produtos'}
        </p>
      )}
    </Panel>
  )
}
