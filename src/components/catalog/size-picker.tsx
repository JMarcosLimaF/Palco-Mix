import { useId, useMemo } from 'react'
import { expandSizes } from '@/lib/sizes'
import { cn } from '@/lib/utils'

export interface SizePickerProps {
  /** numeração do produto, ex.: "34 ao 39" */
  sizes: string | undefined
  value: string | null
  onChange: (size: string | null) => void
  className?: string
}

/**
 * Numeração como seletor (um tamanho por vez; clicar de novo desmarca).
 * Mesma regra do admin (`expandSizes`); formatos não reconhecidos são exibidos como texto.
 */
export function SizePicker({ sizes, value, onChange, className }: SizePickerProps) {
  const text = sizes?.trim()
  const options = useMemo(() => expandSizes(text), [text])
  const labelId = useId()

  if (!text) return null

  if (!options) {
    return (
      <div className={className}>
        <p className="text-sm font-bold text-fg">Numeração</p>
        <p className="mt-1.5 text-sm text-muted">{text}</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <p id={labelId} className="text-sm font-bold text-fg">
          Numeração
        </p>
        <p className="text-xs text-muted" aria-live="polite">
          {value ? (
            <>
              Selecionada: <span className="font-bold text-fg tabular-nums">{value}</span>
            </>
          ) : (
            'Escolha a sua'
          )}
        </p>
      </div>
      <div role="group" aria-labelledby={labelId} className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option === value
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : option)}
              className={cn(
                'inline-flex h-11 min-w-12 items-center justify-center rounded-xl border px-3 text-sm font-semibold tabular-nums',
                'transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out-expo active:scale-[0.94]',
                selected
                  ? 'border-fg bg-fg text-bg shadow-[0_8px_20px_-10px_rgb(13_13_13/0.6)] dark:shadow-none'
                  : 'border-line-strong bg-transparent text-fg hover:border-fg/60 hover:bg-surface-2',
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
