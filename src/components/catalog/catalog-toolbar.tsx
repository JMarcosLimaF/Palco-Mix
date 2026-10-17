import { X } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { memo, useMemo } from 'react'
import { Select } from '@/components/ui/form'
import { useCatalogLookups } from '@/hooks/catalog'
import { SORT_OPTIONS } from '@/lib/catalog-params'
import { cn } from '@/lib/utils'
import type { ProductQuery, ProductSort } from '@/types/catalog'
import { buildActiveFilterChips, effectiveSort } from './catalog-helpers'

const EASE = [0.16, 1, 0.3, 1] as const

export interface SortSelectProps {
  query: ProductQuery
  onSortChange: (sort: ProductSort) => void
  className?: string
}

/** Seletor de ordenação ("Mais relevantes" só aparece quando há busca). */
export function SortSelect({ query, onSortChange, className }: SortSelectProps) {
  const hasSearch = Boolean(query.search?.trim())
  const value = effectiveSort(query)
  const options = hasSearch ? SORT_OPTIONS : SORT_OPTIONS.filter((o) => o.value !== 'relevance')

  return (
    <label className={cn('block', className)}>
      <span className="sr-only">Ordenar por</span>
      <Select
        value={value}
        onChange={(e) => {
          const next = SORT_OPTIONS.find((o) => o.value === e.target.value)
          if (next) onSortChange(next.value)
        }}
        className="h-10 rounded-full bg-transparent pl-4 text-[0.8125rem] font-semibold"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </label>
  )
}

export interface ActiveFiltersProps {
  query: ProductQuery
  onChange: (patch: Partial<ProductQuery>) => void
  onClearAll: () => void
  className?: string
}

/** Chips removíveis dos filtros ativos + "Limpar tudo". */
export const ActiveFilters = memo(function ActiveFilters({ query, onChange, onClearAll, className }: ActiveFiltersProps) {
  const { categoryById, distributorById } = useCatalogLookups()
  const chips = useMemo(
    () => buildActiveFilterChips(query, { categoryById, distributorById }),
    [query, categoryById, distributorById],
  )

  if (chips.length === 0) return null

  return (
    <ul className={cn('flex flex-wrap items-center gap-1.5', className)} aria-label="Filtros ativos">
      <AnimatePresence initial={false} mode="popLayout">
        {chips.map((chip) => (
          <m.li
            key={chip.key}
            layout="position"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <button
              type="button"
              onClick={() => onChange(chip.patch)}
              aria-label={`Remover filtro: ${chip.label}`}
              className="group inline-flex h-8 max-w-[16rem] items-center gap-1.5 rounded-full border border-line bg-elevated pr-2 pl-3 text-xs font-semibold text-fg transition-[background-color,border-color] duration-200 hover:border-line-strong hover:bg-surface-2"
            >
              <span className="truncate">{chip.label}</span>
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-surface-2 text-muted transition-colors group-hover:bg-fg group-hover:text-bg">
                <X className="size-3" aria-hidden />
              </span>
            </button>
          </m.li>
        ))}
        <m.li key="__clear" layout="position" transition={{ duration: 0.22, ease: EASE }}>
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex h-8 items-center rounded-full px-2 text-xs font-bold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Limpar tudo
          </button>
        </m.li>
      </AnimatePresence>
    </ul>
  )
})
