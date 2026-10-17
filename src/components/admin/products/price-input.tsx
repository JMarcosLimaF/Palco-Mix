import type { InputHTMLAttributes, Ref } from 'react'
import { Input } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { formatPriceInput, isValidPrice, parsePrice, sanitizePriceTyping } from './parse-price'

export interface PriceInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'inputMode'> {
  value: string
  onValueChange: (value: string) => void
  ref?: Ref<HTMLInputElement>
}

/**
 * Campo de preço com prefixo "R$". Aceita "106,00", "106.00" e "1.299,90";
 * ao sair do campo, normaliza para o formato brasileiro.
 * Recebe id/aria-* do <Field> e repassa ao <input>.
 */
export function PriceInput({ value, onValueChange, onBlur, className, ref, ...props }: PriceInputProps) {
  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-subtle"
        aria-hidden
      >
        R$
      </span>
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onValueChange(sanitizePriceTyping(e.currentTarget.value))}
        onBlur={(e) => {
          const parsed = parsePrice(value)
          if (isValidPrice(parsed)) {
            const formatted = formatPriceInput(parsed)
            if (formatted !== value) onValueChange(formatted)
          }
          onBlur?.(e)
        }}
        className={cn('pl-11 font-semibold tabular-nums', className)}
        {...props}
      />
    </div>
  )
}
