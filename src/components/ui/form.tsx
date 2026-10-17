/**
 * Controles de formulário do design system.
 * Use <Field> para rótulo + dica + erro acessíveis (aria-describedby automático).
 */
import { ChevronDown } from 'lucide-react'
import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'

const control =
  'w-full rounded-xl border border-line bg-elevated text-fg placeholder:text-subtle ' +
  'transition-[border-color,box-shadow] duration-200 ' +
  'hover:border-line-strong focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger-500 aria-[invalid=true]:focus:ring-danger-500/15'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(control, 'h-11 px-3.5 text-sm', className)} {...props} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 4, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(control, 'px-3.5 py-3 text-sm leading-relaxed', className)} {...props} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, 'h-11 cursor-pointer appearance-none pr-10 pl-3.5 text-sm', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
    </div>
  )
})

export interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: ReactNode
  description?: ReactNode
  disabled?: boolean
  id?: string
  className?: string
}

export function Switch({ checked, onCheckedChange, label, description, disabled, id, className }: SwitchProps) {
  const autoId = useId()
  const switchId = id ?? autoId
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50',
          checked ? 'bg-brand-500' : 'bg-line-strong',
        )}
      >
        <span
          className={cn(
            'inline-block size-5 rounded-full bg-white shadow-md transition-transform duration-300 ease-out-expo',
            checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
          )}
        />
      </button>
      {(label || description) && (
        <label htmlFor={switchId} className="cursor-pointer select-none">
          {label && <span className="block text-sm font-semibold text-fg">{label}</span>}
          {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
        </label>
      )}
    </div>
  )
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  hint?: ReactNode
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <label htmlFor={inputId} className={cn('group flex cursor-pointer items-center gap-2.5 text-sm select-none', className)}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="size-[1.125rem] shrink-0 cursor-pointer rounded-md border-line-strong accent-brand-500"
        {...props}
      />
      {label && <span className="flex-1 text-fg">{label}</span>}
      {hint !== undefined && <span className="text-xs text-subtle tabular-nums">{hint}</span>}
    </label>
  )
})

export interface FieldProps {
  label: ReactNode
  /** Elemento de controle (Input/Select/Textarea) — recebe id e aria-* automaticamente. */
  children: ReactElement<Record<string, unknown>>
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  className?: string
  /** Conteúdo à direita do rótulo (ex: contador de caracteres) */
  aside?: ReactNode
}

export function Field({ label, children, hint, error, required, className, aside }: FieldProps) {
  const id = useId()
  const hintId = hint && !error ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: (children.props.id as string | undefined) ?? id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        required: required || (children.props.required as boolean | undefined),
      })
    : children

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={(isValidElement(children) && (children.props.id as string | undefined)) || id} className="text-sm font-semibold text-fg">
          {label}
          {required && <span className="ml-0.5 text-brand-500" aria-hidden>*</span>}
        </label>
        {aside}
      </div>
      {control}
      {hint && !error && (
        <p id={hintId} className="text-xs text-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger-500">
          {error}
        </p>
      )}
    </div>
  )
}
