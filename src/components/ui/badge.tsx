import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type BadgeTone = 'brand' | 'dark' | 'light' | 'neutral' | 'success' | 'warning' | 'danger' | 'outline' | 'glass'

const tones: Record<BadgeTone, string> = {
  brand: 'bg-brand-500 text-white',
  dark: 'bg-ink-950 text-white dark:bg-white dark:text-ink-950',
  light: 'bg-white text-ink-950 shadow-sm',
  neutral: 'bg-surface-2 text-muted',
  success: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-500/12 text-red-600 dark:text-red-400',
  outline: 'border border-line-strong text-muted',
  glass: 'bg-white/75 text-ink-950 backdrop-blur-md ring-1 ring-black/5 dark:bg-ink-950/60 dark:text-white dark:ring-white/10',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  size?: 'sm' | 'md'
}

export function Badge({ tone = 'neutral', size = 'sm', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap',
        size === 'sm' ? 'h-6 px-2.5 text-[0.6875rem] tracking-wide' : 'h-7 px-3 text-xs',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
