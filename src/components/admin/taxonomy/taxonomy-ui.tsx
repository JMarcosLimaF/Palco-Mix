/**
 * Peças visuais pequenas compartilhadas pelas telas de Categorias e Distribuidores.
 */
import { Globe, Mail, Package, Phone, Tags, Truck, type LucideIcon } from 'lucide-react'
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Input } from '@/components/ui/form'
import { cn, pluralize } from '@/lib/utils'
import { initials } from './logic'
import type { ContactType } from './logic'
import type { TaxonomyKind } from './types'

export interface IconInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon
  /** conteúdo à direita dentro do campo (ex: botão limpar) */
  trailing?: ReactNode
}

/**
 * Input com ícone à esquerda. Repassa id/aria-* ao <input>, então funciona
 * dentro de <Field>. O ícone acende em azul quando o campo recebe foco.
 */
export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(function IconInput(
  { icon: Icon, trailing, className, ...props },
  ref,
) {
  return (
    <div className="relative">
      <Input ref={ref} className={cn('peer pl-10', trailing ? 'pr-11' : undefined, className)} {...props} />
      <Icon
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle transition-colors duration-200 peer-focus:text-brand-500"
        aria-hidden
      />
      {trailing && <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div>}
    </div>
  )
})

/** Selo com as iniciais (itálico extra-negrito, como os títulos da marca). */
export function Monogram({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'title-display inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-[0.95rem] select-none',
        'bg-ink-950 text-white dark:bg-surface-2 dark:text-fg dark:ring-1 dark:ring-line',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

/**
 * Quantidade de produtos vinculados. Com `to`, vira atalho para a lista de
 * produtos do painel já filtrada (acende em azul no hover/foco).
 */
export function UsageBadge({
  count,
  tone = 'neutral',
  className,
  to,
  itemName,
}: {
  count: number
  tone?: BadgeTone
  className?: string
  to?: string
  /** nome do item, para o rótulo acessível do atalho */
  itemName?: string
}) {
  if (count <= 0) {
    return (
      <Badge tone={tone === 'neutral' ? 'outline' : tone} className={className}>
        Sem produtos
      </Badge>
    )
  }
  const label = pluralize(count, 'produto', 'produtos')
  const badge = (
    <Badge
      tone={tone}
      className={cn(
        'tabular-nums',
        to
          ? 'transition-[background-color,color,box-shadow] duration-200 group-hover/usage:bg-brand-500 group-hover/usage:text-white group-hover/usage:ring-transparent'
          : className,
      )}
    >
      <Package className="size-3" aria-hidden />
      {label}
    </Badge>
  )
  if (!to) return badge
  return (
    <Link
      to={to}
      title="Ver produtos no painel"
      aria-label={`Ver ${label}${itemName ? ` de ${itemName}` : ''} no painel`}
      className={cn(
        'group/usage pointer-events-auto inline-flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        className,
      )}
    >
      {badge}
    </Link>
  )
}

/** Contador de caracteres para o `aside` do <Field>. */
export function CharCount({ length, max }: { length: number; max: number }) {
  return (
    <span
      aria-hidden
      className={cn(
        'text-xs tabular-nums transition-colors',
        length >= max ? 'font-semibold text-danger-500' : length > max * 0.85 ? 'text-warning-500' : 'text-subtle',
      )}
    >
      {length}/{max}
    </span>
  )
}

export function TaxonomyKindIcon({ kind, className }: { kind: TaxonomyKind; className?: string }) {
  return kind === 'categories' ? (
    <Tags className={className} aria-hidden />
  ) : (
    <Truck className={className} aria-hidden />
  )
}

export function ContactIcon({ type, className }: { type: ContactType; className?: string }) {
  if (type === 'phone') return <Phone className={className} aria-hidden />
  if (type === 'email') return <Mail className={className} aria-hidden />
  return <Globe className={className} aria-hidden />
}
