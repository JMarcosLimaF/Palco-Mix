import { ArrowDownUp, BadgePercent, CircleDot, Rows3, Search, SlidersHorizontal, Star, Tags, Truck, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/form'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { Category, Distributor } from '@/types/catalog'
import {
  ADMIN_SORT_OPTIONS,
  countAdminFilters,
  hasAdminFilters,
  PAGE_SIZE_OPTIONS,
  RELEVANCE_OPTION,
  STATUS_OPTIONS,
  type AdminFiltersPatch,
  type AdminProductFilters,
  type AdminSort,
  type StatusFilter,
} from './products-params'

const SEARCH_DEBOUNCE_MS = 250

export interface ProductsToolbarProps {
  filters: AdminProductFilters
  onChange: (patch: AdminFiltersPatch, options?: { replace?: boolean }) => void
  onClear: () => void
  categories: Category[]
  distributors: Distributor[]
}

/** Busca + filtros + ordenação da listagem de produtos (estado na URL). */
export function ProductsToolbar({ filters, onChange, onClear, categories, distributors }: ProductsToolbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const panelId = useId()
  const activeCount = countAdminFilters(filters)
  const canClear = hasAdminFilters(filters) || Boolean(filters.sort)
  const hasSearch = filters.search.trim() !== ''
  const sortOptions = hasSearch ? [RELEVANCE_OPTION, ...ADMIN_SORT_OPTIONS] : ADMIN_SORT_OPTIONS
  const sortValue: AdminSort =
    filters.sort && (filters.sort !== 'relevance' || hasSearch) ? filters.sort : hasSearch ? 'relevance' : 'recent'

  const sortSelect = (
    <IconSelect
      icon={<ArrowDownUp />}
      aria-label="Ordenar por"
      value={sortValue}
      onChange={(v) => onChange({ sort: v as AdminSort })}
    >
      {sortOptions.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </IconSelect>
  )

  const pageSizeSelect = (
    <IconSelect
      icon={<Rows3 />}
      aria-label="Itens por página"
      value={String(filters.pageSize)}
      onChange={(v) => onChange({ pageSize: Number(v) })}
    >
      {PAGE_SIZE_OPTIONS.map((n) => (
        <option key={n} value={n}>
          {n} por página
        </option>
      ))}
    </IconSelect>
  )

  const toggleClass = (on: boolean) =>
    cn(
      // celular: pílulas com a largura do rótulo (lado a lado); sm+: botões como antes
      'inline-flex h-10 items-center justify-center gap-2 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap sm:h-11 sm:rounded-xl sm:px-4',
      'transition-[background-color,border-color,color,box-shadow] duration-200 ease-out-expo',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
      on
        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
        : 'border-line bg-elevated text-muted hover:border-line-strong hover:text-fg',
    )

  return (
    <div className="flex flex-col gap-3 border-b border-line p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <SearchField value={filters.search} onCommit={(search) => onChange({ search }, { replace: true })} />

        {/* celular: só o ícone (o campo de busca fica com mais espaço); o número indica filtros ativos */}
        <Button
          variant="outline"
          className={cn(
            'relative size-11 rounded-xl px-0 sm:hidden',
            (mobileOpen || activeCount > 0) && 'border-brand-500/60 text-brand-600 dark:text-brand-400',
          )}
          aria-expanded={mobileOpen}
          aria-controls={panelId}
          aria-label={activeCount > 0 ? `Filtros e ordenação (${activeCount} ativos)` : 'Filtros e ordenação'}
          title="Filtros e ordenação"
          onClick={() => setMobileOpen((o) => !o)}
        >
          <SlidersHorizontal aria-hidden />
          {activeCount > 0 && (
            <span
              aria-hidden
              className="absolute -top-1.5 -right-1.5 inline-flex size-5 items-center justify-center rounded-full bg-brand-500 text-[0.6875rem] font-bold text-white tabular-nums ring-2 ring-elevated"
            >
              {activeCount}
            </span>
          )}
        </Button>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <div className="w-44 lg:w-48">{sortSelect}</div>
          <div className="w-40">{pageSizeSelect}</div>
        </div>
      </div>

      <div
        id={panelId}
        className={cn(
          'grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center',
          mobileOpen ? 'grid animate-fade-in sm:animate-none' : 'hidden',
        )}
      >
        <div className="col-span-2 sm:w-44">
          <IconSelect
            icon={<CircleDot />}
            aria-label="Filtrar por status"
            value={filters.status}
            onChange={(v) => onChange({ status: v as StatusFilter })}
            active={filters.status !== 'all'}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </IconSelect>
        </div>
        <div className="col-span-2 sm:w-52">
          <IconSelect
            icon={<Tags />}
            aria-label="Filtrar por categoria"
            value={filters.category}
            onChange={(v) => onChange({ category: v })}
            active={Boolean(filters.category)}
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </IconSelect>
        </div>
        <div className="col-span-2 sm:w-52">
          <IconSelect
            icon={<Truck />}
            aria-label="Filtrar por distribuidor"
            value={filters.distributor}
            onChange={(v) => onChange({ distributor: v })}
            active={Boolean(filters.distributor)}
          >
            <option value="">Todos os distribuidores</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </IconSelect>
        </div>

        {/* celular: as duas pílulas dividem a linha (quebram se não couberem); sm+: o invólucro some */}
        <div className="col-span-2 flex flex-wrap gap-2 sm:contents">
          <button
            type="button"
            aria-pressed={filters.featured}
            onClick={() => onChange({ featured: !filters.featured })}
            className={toggleClass(filters.featured)}
          >
            <Star className={cn('size-4 transition-transform duration-300', filters.featured && 'scale-110 fill-current')} aria-hidden />
            <span className="sm:hidden">Destaques</span>
            <span className="max-sm:hidden">Somente destaques</span>
          </button>

          <button
            type="button"
            aria-pressed={filters.onSale}
            onClick={() => onChange({ onSale: !filters.onSale })}
            className={toggleClass(filters.onSale)}
          >
            <BadgePercent className={cn('size-4 transition-transform duration-300', filters.onSale && 'scale-110')} aria-hidden />
            Desconto à vista
          </button>
        </div>

        {/* ordenação fica no painel recolhível só no celular; itens por página vão para o rodapé da lista */}
        <div className="col-span-2 sm:hidden">{sortSelect}</div>

        {canClear && (
          <Button
            variant="ghost"
            className="col-span-2 h-11 text-muted hover:text-fg sm:ml-auto sm:h-10"
            onClick={() => {
              onClear()
              setMobileOpen(false)
            }}
          >
            <X aria-hidden />
            Limpar
          </Button>
        )}
      </div>
    </div>
  )
}

interface IconSelectProps {
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  children: ReactNode
  active?: boolean
  'aria-label': string
}

function IconSelect({ icon, value, onChange, children, active = false, 'aria-label': ariaLabel }: IconSelectProps) {
  return (
    <div className="relative">
      <span
        className={cn(
          'pointer-events-none absolute top-1/2 left-3.5 z-[1] -translate-y-1/2 transition-colors [&_svg]:size-4',
          active ? 'text-brand-500' : 'text-subtle',
        )}
        aria-hidden
      >
        {icon}
      </span>
      <Select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        className={cn('truncate pl-10', active && 'border-brand-500/60 font-semibold')}
      >
        {children}
      </Select>
    </div>
  )
}

interface SearchFieldProps {
  value: string
  onCommit: (value: string) => void
}

/** Campo de busca com debounce: digita local, grava na URL 250ms depois da última tecla. */
function SearchField({ value: urlValue, onCommit }: SearchFieldProps) {
  const [value, setValue] = useState(urlValue)
  const [syncedUrlValue, setSyncedUrlValue] = useState(urlValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const commitRef = useRef(onCommit)
  // no celular o campo é estreito (fonte de 16px): dica curta em vez de cortada no meio
  const wide = useMediaQuery('(min-width: 640px)')

  // a URL mudou por fora (Limpar, voltar/avançar): reflete no campo
  if (urlValue !== syncedUrlValue) {
    setSyncedUrlValue(urlValue)
    if (urlValue.trim() !== value.trim()) setValue(urlValue)
  }

  useEffect(() => {
    commitRef.current = onCommit
  })

  useEffect(() => {
    const pending = timer
    return () => window.clearTimeout(pending.current)
  }, [])

  function handleChange(next: string) {
    setValue(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => commitRef.current(next), SEARCH_DEBOUNCE_MS)
  }

  function clear() {
    window.clearTimeout(timer.current)
    setValue('')
    commitRef.current('')
    inputRef.current?.focus()
  }

  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => handleChange(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.preventDefault()
            clear()
          }
        }}
        placeholder={wide ? 'Buscar por nome, marca, categoria ou código…' : 'Nome, marca ou código…'}
        aria-label="Buscar produtos"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        className={cn('pl-10', value ? 'pr-11 sm:pr-10' : 'pr-3 sm:pr-10')}
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Limpar busca"
          className="absolute top-1/2 right-0.5 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-subtle transition-colors hover:bg-surface-2 hover:text-fg sm:right-1.5 sm:size-8"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  )
}
