import { ArrowDownAZ, Clock, Package, Search, X } from 'lucide-react'
import { m } from 'motion/react'
import { useId, useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { TAXONOMY_SORT_OPTIONS } from './config'
import { IconInput } from './taxonomy-ui'
import type { TaxonomySort } from './types'

export interface TaxonomyToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  sort: TaxonomySort
  onSortChange: (value: TaxonomySort) => void
  searchLabel: string
  searchPlaceholder: string
  /** texto do contador (anunciado a leitores de tela) */
  status: string
  /** exibe o contador visualmente (quando há busca ativa) */
  showStatus: boolean
}

/** Busca instantânea + ordenação segmentada. */
export function TaxonomyToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  searchLabel,
  searchPlaceholder,
  status,
  showStatus,
}: TaxonomyToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <IconInput
            ref={inputRef}
            icon={Search}
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && search) {
                e.preventDefault()
                e.stopPropagation()
                onSearchChange('')
              }
            }}
            placeholder={`${searchPlaceholder}…`}
            aria-label={searchLabel}
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            trailing={
              search ? (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('')
                    inputRef.current?.focus()
                  }}
                  aria-label="Limpar busca"
                  className="inline-flex size-8 items-center justify-center rounded-full text-subtle transition-colors duration-200 hover:bg-surface-2 hover:text-fg"
                >
                  <X className="size-4" aria-hidden />
                </button>
              ) : null
            }
          />
        </div>
        <SortControl value={sort} onChange={onSortChange} />
      </div>
      <p role="status" className={showStatus ? 'px-1 text-xs text-subtle tabular-nums' : 'sr-only'}>
        {status}
      </p>
    </div>
  )
}

const SORT_ICONS = {
  name: ArrowDownAZ,
  usage: Package,
  recent: Clock,
} as const

/** Controle segmentado acessível (radiogroup com setas, Home/End). */
function SortControl({ value, onChange }: { value: TaxonomySort; onChange: (value: TaxonomySort) => void }) {
  const pillId = useId()
  const buttons = useRef<Array<HTMLButtonElement | null>>([])

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = TAXONOMY_SORT_OPTIONS.length - 1
    let next = -1
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index === last ? 0 : index + 1
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index === 0 ? last : index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    if (next < 0) return
    event.preventDefault()
    onChange(TAXONOMY_SORT_OPTIONS[next].value)
    buttons.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Ordenar por"
      className="flex w-full shrink-0 rounded-full bg-surface-2 p-1 ring-1 ring-line/70 ring-inset sm:inline-flex sm:w-auto"
    >
      {TAXONOMY_SORT_OPTIONS.map((option, index) => {
        const active = option.value === value
        const Icon = SORT_ICONS[option.value]
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttons.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'relative inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold whitespace-nowrap sm:h-9 sm:flex-none sm:px-3.5',
              'transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
              active ? 'text-fg' : 'text-muted hover:text-fg',
            )}
          >
            {active && (
              <m.span
                layoutId={pillId}
                aria-hidden
                className="absolute inset-0 rounded-full bg-elevated shadow-sm ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
              />
            )}
            <Icon className={cn('relative hidden size-3.5 sm:block', active ? 'text-brand-500' : undefined)} aria-hidden />
            <span className="relative sm:hidden">{option.short}</span>
            <span className="relative hidden sm:inline">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
