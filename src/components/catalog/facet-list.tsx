import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Checkbox } from '@/components/ui/form'
import { cn, normalizeText } from '@/lib/utils'

export interface FacetOption {
  id: string
  name: string
}

export interface FacetListProps {
  /** rótulo da lista (acessibilidade) */
  label: string
  options: FacetOption[]
  selected: string[] | undefined
  /** contagem por id considerando os demais filtros (undefined = carregando) */
  counts: Record<string, number> | undefined
  onToggle: (id: string) => void
  /** acima deste número aparece "Mostrar mais" (e o campo de filtro, se `searchable`) */
  limit?: number
  searchable?: boolean
  searchPlaceholder?: string
  /** ordena por contagem (desc) e depois por nome */
  sortByCount?: boolean
  loading?: boolean
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' })

/**
 * Lista de checkboxes de uma faceta (categorias/distribuidores).
 * Opções sem resultados ficam esmaecidas e desabilitadas — mas as selecionadas
 * nunca somem nem travam (sempre dá para desmarcar).
 */
export function FacetList({
  label,
  options,
  selected,
  counts,
  onToggle,
  limit = 8,
  searchable = false,
  searchPlaceholder = 'Filtrar',
  sortByCount = false,
  loading = false,
}: FacetListProps) {
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState(false)
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const ordered = useMemo(() => {
    if (!sortByCount || !counts) return options
    return [...options].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || collator.compare(a.name, b.name))
  }, [options, counts, sortByCount])

  const needle = normalizeText(filter)
  const showSearch = searchable && options.length > limit
  const collapsible = ordered.length > limit

  const visible = useMemo(() => {
    if (needle) return ordered.filter((o) => normalizeText(o.name).includes(needle))
    if (expanded || !collapsible) return ordered
    const head = ordered.slice(0, limit)
    const headIds = new Set(head.map((o) => o.id))
    // selecionados fora do topo continuam visíveis
    return [...head, ...ordered.filter((o) => !headIds.has(o.id) && selectedSet.has(o.id))]
  }, [needle, ordered, expanded, collapsible, limit, selectedSet])

  const hiddenCount = ordered.length - visible.length

  if (loading) {
    return (
      <div className="space-y-2.5 py-1" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-5 rounded-md" style={{ width: `${80 - i * 12}%` }} />
        ))}
      </div>
    )
  }

  if (options.length === 0) return <p className="py-1 text-xs text-subtle">Nenhuma opção disponível.</p>

  return (
    <div>
      {showSearch && (
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-9 w-full rounded-full border border-line bg-surface pr-8 pl-8 text-[0.8125rem] text-fg placeholder:text-subtle transition-[border-color,box-shadow] duration-200 hover:border-line-strong focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none"
          />
          {filter && (
            <button
              type="button"
              onClick={() => setFilter('')}
              aria-label="Limpar filtro"
              className="absolute top-1/2 right-1.5 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-subtle transition hover:bg-surface-2 hover:text-fg"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
      )}

      <ul aria-label={label} className="flex flex-col">
        {visible.map((option) => {
          const isSelected = selectedSet.has(option.id)
          const count = counts?.[option.id] ?? (counts ? 0 : undefined)
          const empty = count === 0 && !isSelected
          return (
            <li key={option.id}>
              <Checkbox
                checked={isSelected}
                disabled={empty}
                onChange={() => onToggle(option.id)}
                label={option.name}
                hint={count === undefined ? '' : count}
                className={cn(
                  '-mx-2 min-h-10 rounded-lg px-2 transition-colors duration-150 hover:bg-surface-2',
                  isSelected && '[&>span:first-of-type]:font-semibold',
                  empty && 'cursor-not-allowed opacity-45 hover:bg-transparent',
                )}
              />
            </li>
          )
        })}
      </ul>

      {needle && visible.length === 0 && <p className="py-2 text-xs text-subtle">Nenhuma opção encontrada.</p>}

      {!needle && collapsible && (expanded || hiddenCount > 0) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-1 inline-flex min-h-9 items-center rounded-full text-xs font-bold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          {expanded ? 'Mostrar menos' : `Mostrar mais (${hiddenCount})`}
        </button>
      )}
    </div>
  )
}
