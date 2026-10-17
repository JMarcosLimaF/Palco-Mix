import { ArrowUpRight, Package, type LucideIcon } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Skeleton } from '@/components/ui/feedback'
import { cn } from '@/lib/utils'
import { formatCount } from './dashboard-utils'

const EASE = [0.16, 1, 0.3, 1] as const

export type StatTone = 'brand' | 'neutral' | 'amber' | 'emerald'

const TONES: Record<StatTone, string> = {
  brand: 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
  neutral: 'bg-fg/[0.06] text-fg',
  amber: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
  emerald: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
}

/** Entrada escalonada dos cartões. */
function Reveal({ index, className, children }: { index: number; className?: string; children: ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.04 * index, ease: EASE }}
      className={className}
    >
      {children}
    </m.div>
  )
}

const cardBase =
  'group/stat relative flex h-full flex-col justify-between overflow-hidden rounded-2xl outline-offset-4 ' +
  'transition-[transform,box-shadow,border-color] duration-300 ease-out-expo hover:-translate-y-0.5 active:translate-y-0'

export interface StatCardProps {
  to: string
  icon: LucideIcon
  label: string
  value: number
  caption: ReactNode
  tone?: StatTone
  index?: number
  className?: string
}

/** Métrica rápida clicável (leva à tela correspondente). */
export function StatCard({
  to,
  icon: Icon,
  label,
  value,
  caption,
  tone = 'brand',
  index = 0,
  className,
}: StatCardProps) {
  return (
    <Reveal index={index} className={className}>
      <Link
        to={to}
        className={cn(
          cardBase,
          'gap-6 border border-line bg-elevated p-4 shadow-card hover:border-line-strong hover:shadow-card-hover sm:p-5',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span className={cn('inline-flex size-10 items-center justify-center rounded-xl', TONES[tone])}>
            <Icon className="size-5" aria-hidden />
          </span>
          <ArrowUpRight
            className="size-4 text-subtle transition-[transform,color] duration-300 ease-out-expo group-hover/stat:translate-x-0.5 group-hover/stat:-translate-y-0.5 group-hover/stat:text-brand-500"
            aria-hidden
          />
        </div>
        <div className="min-w-0">
          <p className="text-[2rem] leading-none font-extrabold tracking-tight text-fg tabular-nums">
            {formatCount(value)}
          </p>
          <p className="mt-2 truncate text-sm font-bold text-fg">{label}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{caption}</p>
        </div>
      </Link>
    </Reveal>
  )
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex flex-col gap-6 rounded-2xl border border-line bg-elevated p-4 shadow-card sm:p-5', className)}
    >
      <Skeleton className="size-10" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-3 w-32 rounded-md" />
      </div>
    </div>
  )
}

export interface TotalProductsCardProps {
  total: number
  active: number
  inactive: number
  className?: string
}

/** Cartão de destaque (preto da marca) com o total e a divisão ativos/inativos. */
export function TotalProductsCard({ total, active, inactive, className }: TotalProductsCardProps) {
  const reduceMotion = useReducedMotion()
  const activeRatio = total > 0 ? active / total : 0
  return (
    <Reveal index={0} className={className}>
      <Link
        to="/admin/produtos"
        aria-label={`Total de produtos: ${formatCount(total)} (${formatCount(active)} ativos, ${formatCount(inactive)} inativos). Gerenciar produtos`}
        className={cn(
          cardBase,
          'min-h-56 gap-8 bg-ink-950 p-5 text-white shadow-card ring-1 ring-white/10 hover:shadow-glow sm:p-6',
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 -right-20 size-80 rounded-full bg-[radial-gradient(closest-side,rgb(0_102_255/0.45),transparent)] transition-opacity duration-500 group-hover/stat:opacity-80"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_55%,rgb(255_255_255/0.04)_55%,rgb(255_255_255/0.04)_62%,transparent_62%)]"
        />

        <div className="relative flex items-start justify-between gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/10">
            <Package className="size-5" aria-hidden />
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/60 transition-colors duration-200 group-hover/stat:text-white">
            Gerenciar
            <ArrowUpRight
              className="size-3.5 transition-transform duration-300 ease-out-expo group-hover/stat:translate-x-0.5 group-hover/stat:-translate-y-0.5"
              aria-hidden
            />
          </span>
        </div>

        <div className="relative">
          <p className="eyebrow text-white/55">Total de produtos</p>
          <p className="title-display mt-2 pr-2 text-6xl tabular-nums sm:text-7xl">{formatCount(total)}</p>

          <div className="mt-6">
            <div
              className="flex h-2 overflow-hidden rounded-full bg-white/12"
              role="img"
              aria-label={`${formatCount(active)} ativos e ${formatCount(inactive)} inativos`}
            >
              <m.div
                className="h-full rounded-full bg-brand-500"
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${activeRatio * 100}%` }}
                transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-brand-500" aria-hidden />
                <strong className="font-bold text-white tabular-nums">{formatCount(active)}</strong> ativos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-white/30" aria-hidden />
                <strong className="font-bold text-white tabular-nums">{formatCount(inactive)}</strong> inativos
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Reveal>
  )
}

export function TotalProductsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-h-56 flex-col justify-between gap-8 rounded-2xl bg-ink-950 p-5 sm:p-6', className)}>
      <div className="size-10 rounded-xl bg-white/10" />
      <div className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
        <div className="h-14 w-32 animate-pulse rounded-xl bg-white/10" />
        <div className="h-2 w-full rounded-full bg-white/10" />
      </div>
    </div>
  )
}
