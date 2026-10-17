import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface FilterSectionProps {
  title: string
  /** quantidade de opções selecionadas (mostra um contador ao lado do título) */
  count?: number
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

/**
 * Seção recolhível dos filtros (accordion simples).
 * Altura animada por CSS (grid-template-rows 0fr → 1fr); conteúdo recolhido fica `inert`.
 */
export function FilterSection({ title, count = 0, defaultOpen = true, children, className }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  const panelId = `${id}-panel`
  const buttonId = `${id}-button`

  return (
    <section className={cn('border-b border-line py-4 last:border-b-0', className)}>
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-lg text-left text-[0.9375rem] font-bold text-fg lg:min-h-10 lg:text-sm"
        >
          <span className="flex items-center gap-2">
            {title}
            {count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[0.6875rem] font-bold text-white tabular-nums">
                {count}
              </span>
            )}
          </span>
          <ChevronDown
            className={cn(
              'size-4 text-subtle transition-transform duration-300 ease-out-expo group-hover:text-fg',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        inert={!open}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out-expo',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        {/* -mx/px: espaço para o anel de foco não ser cortado pelo overflow */}
        <div className="-mx-1.5 min-h-0 overflow-hidden px-1.5">
          <div className="pt-2 pb-1">{children}</div>
        </div>
      </div>
    </section>
  )
}
