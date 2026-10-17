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
        // no celular, compacto (círculo menor) mas com alvo de toque ≥ 40px de altura
        'group/action inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full py-1 pl-1 text-sm font-semibold sm:gap-3',
        inverted ? 'text-white' : 'text-fg',
        className,
      )}
    >
      {label}
      <span
        aria-hidden
        className={cn(
          'relative inline-flex size-8 items-center justify-center overflow-hidden rounded-full border sm:size-10',
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
  /** exibe a descrição também no celular (por padrão ela só aparece a partir de sm, para poupar altura) */
  mobileDescription?: boolean
  className?: string
}

export function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  action,
  tone = 'default',
  mobileDescription = false,
  className,
}: SectionHeaderProps) {
  const inverted = tone === 'inverted'
  return (
    // celular: título e "Ver todos" na mesma linha (sem quebrar); sm+: o link pode descer se faltar espaço
    <div className={cn('flex items-end justify-between gap-x-4 gap-y-5 sm:flex-wrap sm:gap-x-8', className)}>
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
            'title-display mt-2 text-[1.75rem] leading-[1.05] text-balance sm:mt-3 sm:text-4xl sm:leading-[1.02] lg:text-5xl',
            inverted ? 'text-white' : 'text-fg',
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              'mt-2 max-w-xl text-sm leading-relaxed sm:mt-3 sm:block sm:text-base',
              !mobileDescription && 'hidden',
              inverted ? 'text-white/60' : 'text-muted',
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <SectionAction {...action} inverted={inverted} />}
    </div>
  )
}
