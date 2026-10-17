import { publicAsset } from '@/lib/base-path'
import { cn } from '@/lib/utils'

/**
 * Símbolo Palco Mix: barra diagonal (tinta/branco, segue `currentColor`)
 * + chevron azul elétrico, redesenhados em vetor a partir do logo oficial.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 480 330"
      className={cn('h-8 w-auto', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <polygon points="5,325 86,325 316,78 252,78" fill="currentColor" />
      <polygon points="236,6 352,6 474,122 352,240 236,240 352,122" fill="#0066FF" />
    </svg>
  )
}

export interface LogoProps {
  className?: string
  /** compact = só "Palco Mix"; full = com "Calçados e Acessórios" e faixa colorida */
  variant?: 'compact' | 'full'
  /** força cores claras (uso sobre fundos escuros, ex: rodapé/hero) */
  inverted?: boolean
}

export function Logo({ className, variant = 'compact', inverted = false }: LogoProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-2.5', inverted ? 'text-white' : 'text-ink-950 dark:text-white', className)}
      aria-label="Palco Mix Calçados e Acessórios"
      role="img"
    >
      <LogoMark className={variant === 'full' ? 'h-10' : 'h-7'} />
      <span className="flex flex-col leading-none" aria-hidden>
        <span className="flex items-baseline gap-1">
          <span className={cn('title-display', variant === 'full' ? 'text-[1.9rem]' : 'text-[1.4rem]')}>Palco</span>
          <span className={cn('font-display font-extrabold italic text-brand-500', variant === 'full' ? 'text-lg' : 'text-[0.95rem]')}>
            Mix
          </span>
        </span>
        {variant === 'full' && (
          <>
            <span className="mt-1.5 text-[0.56rem] font-bold tracking-[0.24em] uppercase opacity-80">Calçados e Acessórios</span>
            <span className="logo-stripe mt-1.5 h-[2px] w-full rounded-full" />
          </>
        )}
      </span>
    </span>
  )
}

/** Logo oficial (raster, selo circular) — login, rodapé, compartilhamento. */
export function LogoBadge({ className, size = 96 }: { className?: string; size?: number }) {
  return (
    <img
      src={publicAsset(size <= 320 ? '/brand/logo-palcomix-320.webp' : '/brand/logo-palcomix.webp')}
      width={size}
      height={size}
      alt="Palco Mix Calçados e Acessórios"
      className={cn('rounded-full shadow-[0_0_0_1px_rgb(0_102_255/0.35),0_20px_60px_-20px_rgb(0_102_255/0.6)]', className)}
      decoding="async"
    />
  )
}
