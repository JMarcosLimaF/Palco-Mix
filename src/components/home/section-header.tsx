import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

export interface SectionActionProps {
  to: string
  label: string
  /** rótulo acessível quando o texto visível é genérico ("Ver todos") */
  ariaLabel?: string
  inverted?: boolean
  className?: string
}

/** Link "Ver todos" com seta que desliza para fora e volta pelo outro lado no hover. */
export function SectionAction({ to, label, ariaLabel, inverted = false, className }: SectionActionProps) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className={cn(
        'group/action inline-flex shrink-0 items-center gap-3 rounded-full py-1 pl-1 text-sm font-semibold',
        inverted ? 'text-white' : 'text-fg',
        className,
      )}
    >
      {label}
      <span
        aria-hidden
        className={cn(
          'relative inline-flex size-10 items-center justify-center overflow-hidden rounded-full border',
          'transition-[background-color,border-color,color] duration-300 ease-out-expo',
          inverted
            ? 'border-white/25 group-hover/action:border-white group-hover/action:bg-white group-hover/action:text-ink-950'
            : 'border-line-strong group-hover/action:border-fg group-hover/action:bg-fg group-hover/action:text-bg',
        )}
      >
        <ArrowRight className="size-4 transition-transform duration-500 ease-out-expo group-hover/action:translate-x-[180%]" />
        <ArrowRight className="absolute size-4 -translate-x-[180%] transition-transform duration-500 ease-out-expo group-hover/action:translate-x-0" />
      </span>
    </Link>
  )
}

export interface SectionHeaderProps {
  /** id do <h2> — use em aria-labelledby da <section> */
  id: string
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: Omit<SectionActionProps, 'inverted' | 'className'>
  /** inverted = sobre fundo escuro */
  tone?: 'default' | 'inverted'
  className?: string
}

export function SectionHeader({ id, eyebrow, title, description, action, tone = 'default', className }: SectionHeaderProps) {
  const inverted = tone === 'inverted'
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-8 gap-y-5', className)}>
      <div className="max-w-2xl min-w-0">
        {eyebrow && (
          <p
            className={cn(
              'eyebrow flex items-center gap-2',
              inverted ? 'text-brand-300' : 'text-brand-600 dark:text-brand-400',
            )}
          >
            <span aria-hidden className="h-px w-6 bg-current" />
            {eyebrow}
          </p>
        )}
        <h2
          id={id}
          className={cn(
            'title-display mt-3 text-3xl text-balance sm:text-4xl lg:text-5xl',
            inverted ? 'text-white' : 'text-fg',
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={cn('mt-3 max-w-xl text-sm leading-relaxed sm:text-base', inverted ? 'text-white/60' : 'text-muted')}>
            {description}
          </p>
        )}
      </div>
      {action && <SectionAction {...action} inverted={inverted} />}
    </div>
  )
}
