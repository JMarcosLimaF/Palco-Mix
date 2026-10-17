import { ArrowDownUp, X } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { memo, useMemo, useRef } from 'react'
import { Select } from '@/components/ui/form'
import { useCatalogLookups } from '@/hooks/catalog'
import { SORT_OPTIONS } from '@/lib/catalog-params'
import { cn } from '@/lib/utils'
import type { ProductQuery, ProductSort } from '@/types/catalog'
import { buildActiveFilterChips, defaultSort, effectiveSort } from './catalog-helpers'

const EASE = [0.16, 1, 0.3, 1] as const

export interface SortSelectProps {
  query: ProductQuery
  onSortChange: (sort: ProductSort) => void
  /** field = campo com o rótulo da ordenação (desktop); pill = botão compacto "Ordenar" (barra do celular) */
  variant?: 'field' | 'pill'
  className?: string
}

/** Seletor de ordenação ("Mais relevantes" só aparece quando há busca). */
export function SortSelect({ query, onSortChange, variant = 'field', className }: SortSelectProps) {
  const hasSearch = Boolean(query.search?.trim())
  const value = effectiveSort(query)
  const options = hasSearch ? SORT_OPTIONS : SORT_OPTIONS.filter((o) => o.value !== 'relevance')

  const select = (selectClassName: string) => (
    <Select
      value={value}
      onChange={(e) => {
        const next = SORT_OPTIONS.find((o) => o.value === e.target.value)
        if (next) onSortChange(next.value)
      }}
      className={selectClassName}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  )

  if (variant === 'pill') {
    // o <select> nativo (invisível) cobre a pílula: o toque abre o seletor do sistema
    // e o leitor de tela ouve "Ordenar por" + a opção atual
    const custom = value !== defaultSort(query)
    return (
      <label
        className={cn(
          'relative inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line-strong px-3.5 text-[0.8125rem] font-semibold text-fg',
          'transition-[background-color,border-color,transform] duration-200 ease-out-expo hover:bg-surface-2 active:scale-[0.97]',
          'has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-offset-2 has-[select:focus-visible]:outline-brand-500',
          className,
        )}
      >
        <ArrowDownUp className="size-4" aria-hidden />
        <span aria-hidden>Ordenar</span>
        {custom && <span className="size-1.5 rounded-full bg-brand-500" aria-hidden />}
        <span className="sr-only">Ordenar por</span>
        <span className="absolute inset-0 [&>div]:size-full">
          {select('size-full cursor-pointer opacity-0 [&+svg]:hidden')}
        </span>
      </label>
    )
  }

  return (
    <label className={cn('block', className)}>
      <span className="sr-only">Ordenar por</span>
      {select('h-10 rounded-full bg-transparent pl-4 text-[0.8125rem] font-semibold')}
    </label>
  )
}

export interface ActiveFiltersProps {
  query: ProductQuery
  onChange: (patch: Partial<ProductQuery>) => void
  onClearAll: () => void
  /** recebe o foco quando a lista some (último chip removido ou "Limpar tudo") */
  onFocusFallback?: () => void
  className?: string
}

/** Chips removíveis dos filtros ativos + "Limpar tudo". */
export const ActiveFilters = memo(function ActiveFilters({
  query,
  onChange,
  onClearAll,
  onFocusFallback,
  className,
}: ActiveFiltersProps) {
  const { categoryById, distributorById } = useCatalogLookups()
  const chips = useMemo(
    () => buildActiveFilterChips(query, { categoryById, distributorById }),
    [query, categoryById, distributorById],
  )
  const buttons = useRef(new Map<string, HTMLButtonElement>())

  if (chips.length === 0) return null

  // o botão focado vai sair do DOM: leva o foco ao chip seguinte, ao anterior
  // ou, se não sobrar nenhum, ao alvo da página (senão ele cai no <body>)
  function removeChip(index: number) {
    const neighbor = chips[index + 1] ?? chips[index - 1]
    const target = neighbor && buttons.current.get(neighbor.key)
    if (target) target.focus()
    else onFocusFallback?.()
    onChange(chips[index].patch)
  }

  function clearAll() {
    onFocusFallback?.()
    onClearAll()
  }

  return (
    // celular: uma linha rolável que sangra até a borda (o chip cortado indica que há mais);
    // py/-my: folga para o anel de foco dentro do overflow
    <ul
      className={cn(
        '-mx-4 -my-1 flex items-center gap-2 overflow-x-auto scroll-px-4 px-4 py-1 scrollbar-none',
        'sm:mx-0 sm:my-0 sm:flex-wrap sm:gap-1.5 sm:overflow-visible sm:px-0 sm:py-0',
        className,
      )}
      aria-label="Filtros ativos"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {chips.map((chip, index) => (
          <m.li
            key={chip.key}
            className="shrink-0"
            layout="position"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <button
              ref={(el) => {
                if (!el) return
                buttons.current.set(chip.key, el)
                return () => {
                  buttons.current.delete(chip.key)
                }
              }}
              type="button"
              onClick={() => removeChip(index)}
              aria-label={`Remover filtro: ${chip.label}`}
              className="group inline-flex h-10 max-w-[16rem] items-center gap-1.5 rounded-full border border-line bg-elevated pr-2.5 pl-3.5 text-[0.8125rem] font-semibold whitespace-nowrap text-fg transition-[background-color,border-color] duration-200 hover:border-line-strong hover:bg-surface-2 sm:h-8 sm:pr-2 sm:pl-3 sm:text-xs"
            >
              <span className="truncate">{chip.label}</span>
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-surface-2 text-muted transition-colors group-hover:bg-fg group-hover:text-bg sm:size-4">
                <X className="size-3" aria-hidden />
              </span>
            </button>
          </m.li>
        ))}
        <m.li key="__clear" className="shrink-0" layout="position" transition={{ duration: 0.22, ease: EASE }}>
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex h-10 items-center rounded-full px-3 text-[0.8125rem] font-bold whitespace-nowrap text-brand-600 sm:h-8 sm:px-2 sm:text-xs transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Limpar tudo
          </button>
        </m.li>
      </AnimatePresence>
    </ul>
  )
})
