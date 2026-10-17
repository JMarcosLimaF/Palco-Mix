import { useMemo, useState, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import {
  buildPriceShortcuts,
  formatPriceCompact,
  formatPriceInput,
  parsePriceInput,
} from './catalog-helpers'

export interface PriceFilterProps {
  minPrice: number | undefined
  maxPrice: number | undefined
  /** faixa de preço dos resultados (desconsiderando o próprio filtro de preço) */
  range: { min: number; max: number } | undefined
  onChange: (min: number | undefined, max: number | undefined) => void
}

const inputClass =
  'h-11 w-full rounded-xl border border-line bg-elevated pr-3 pl-9 text-sm text-fg tabular-nums placeholder:text-subtle lg:h-10 ' +
  'transition-[border-color,box-shadow] duration-200 hover:border-line-strong focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none'

/**
 * Faixa de preço: campos mín./máx. (aceitam vírgula; aplicam ao sair do campo
 * ou com Enter) + atalhos gerados a partir da faixa real dos resultados.
 */
export function PriceFilter({ minPrice, maxPrice, range, onChange }: PriceFilterProps) {
  const [minText, setMinText] = useState(() => formatPriceInput(minPrice))
  const [maxText, setMaxText] = useState(() => formatPriceInput(maxPrice))
  // sincroniza os campos quando a URL muda por fora (chip removido, "limpar", voltar)
  const [synced, setSynced] = useState({ minPrice, maxPrice })
  if (synced.minPrice !== minPrice || synced.maxPrice !== maxPrice) {
    setSynced({ minPrice, maxPrice })
    setMinText(formatPriceInput(minPrice))
    setMaxText(formatPriceInput(maxPrice))
  }

  const rangeMin = range?.min
  const rangeMax = range?.max
  const shortcuts = useMemo(
    () => (rangeMin === undefined || rangeMax === undefined ? [] : buildPriceShortcuts({ min: rangeMin, max: rangeMax })),
    [rangeMin, rangeMax],
  )

  function apply() {
    const parsedMin = parsePriceInput(minText)
    const parsedMax = parsePriceInput(maxText)
    let nextMin = parsedMin === null ? minPrice : parsedMin
    let nextMax = parsedMax === null ? maxPrice : parsedMax
    if (nextMin !== undefined && nextMax !== undefined && nextMin > nextMax) [nextMin, nextMax] = [nextMax, nextMin]
    // reescreve os campos no formato canônico (ou desfaz valor inválido)
    setMinText(formatPriceInput(nextMin))
    setMaxText(formatPriceInput(nextMax))
    if (nextMin !== minPrice || nextMax !== maxPrice) onChange(nextMin, nextMax)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      apply()
    }
  }

  const hasRange = rangeMin !== undefined && rangeMax !== undefined && rangeMax > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Preço mínimo, em reais</span>
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-subtle" aria-hidden>
            R$
          </span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Mínimo"
            value={minText}
            onChange={(e) => setMinText(e.target.value)}
            onBlur={apply}
            onKeyDown={handleKeyDown}
            className={inputClass}
          />
        </label>
        <span className="h-px w-3 shrink-0 bg-line-strong" aria-hidden />
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Preço máximo, em reais</span>
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-subtle" aria-hidden>
            R$
          </span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Máximo"
            value={maxText}
            onChange={(e) => setMaxText(e.target.value)}
            onBlur={apply}
            onKeyDown={handleKeyDown}
            className={inputClass}
          />
        </label>
      </div>

      {hasRange && (
        <p className="text-xs text-subtle tabular-nums">
          {rangeMin > 0
            ? `De ${formatPriceCompact(Math.floor(rangeMin))} a ${formatPriceCompact(Math.ceil(rangeMax))} nos resultados`
            : `Até ${formatPriceCompact(Math.ceil(rangeMax))} nos resultados`}
        </p>
      )}

      {shortcuts.length > 0 && (
        <ul className="flex flex-wrap gap-2 lg:gap-1.5" aria-label="Atalhos de faixa de preço">
          {shortcuts.map((s) => {
            const active = s.min === minPrice && s.max === maxPrice
            return (
              <li key={s.key}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => (active ? onChange(undefined, undefined) : onChange(s.min, s.max))}
                  className={cn(
                    'inline-flex h-10 items-center rounded-full border px-3.5 text-[0.8125rem] font-semibold tabular-nums transition-[background-color,border-color,color,transform] duration-200 ease-out-expo active:scale-[0.96] lg:h-8 lg:px-3 lg:text-xs',
                    active
                      ? 'border-fg bg-fg text-bg'
                      : 'border-line bg-transparent text-muted hover:border-line-strong hover:text-fg',
                  )}
                >
                  {s.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
