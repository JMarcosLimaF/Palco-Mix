import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'whatsapp' | 'subtle'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

const base =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none ' +
  'transition-[background-color,color,box-shadow,transform,border-color,opacity] duration-200 ease-out-expo ' +
  'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 [&_svg]:shrink-0'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-gradient text-white shadow-[0_6px_20px_-8px_rgb(0_102_255/0.7)] hover:shadow-glow hover:brightness-110',
  secondary: 'bg-fg text-bg hover:bg-ink-800 dark:hover:bg-white/90',
  outline: 'border border-line-strong bg-transparent text-fg hover:border-fg/40 hover:bg-surface-2',
  ghost: 'bg-transparent text-fg hover:bg-surface-2',
  subtle: 'bg-surface-2 text-fg hover:bg-line',
  danger: 'bg-danger-600 text-white hover:bg-danger-500 shadow-[0_6px_20px_-10px_rgb(220_38_38/0.8)]',
  whatsapp: 'bg-[#25D366] text-[#0b3d1f] hover:bg-[#1fc15c] shadow-[0_6px_20px_-10px_rgb(37_211_102/0.9)]',
}

const sizes: Record<ButtonSize, string> = {
  xs: 'h-8 px-3 text-xs [&_svg]:size-3.5',
  sm: 'h-9 px-4 text-sm [&_svg]:size-4',
  md: 'h-11 px-5 text-sm [&_svg]:size-[1.1rem]',
  lg: 'h-13 px-7 text-base [&_svg]:size-5',
  icon: 'size-10 [&_svg]:size-[1.15rem]',
  'icon-sm': 'size-8 [&_svg]:size-4',
}

/** Classes de botão para usar em <Link> ou <a>. */
export function buttonVariants({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className)
}
