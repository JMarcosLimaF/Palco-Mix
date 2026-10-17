import { Phone } from 'lucide-react'
import { forwardRef, type ChangeEvent, type InputHTMLAttributes } from 'react'
import { caretAfterDigits, formatPhone, onlyDigits } from './logic'
import { IconInput } from './taxonomy-ui'

export interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string
  onValueChange: (value: string) => void
}

/**
 * Telefone com máscara leve brasileira. Mantém o cursor no lugar ao editar no
 * meio do número e permite apagar "através" de parênteses, espaço e hífen.
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  { value, onValueChange, ...props },
  ref,
) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const el = event.target
    const raw = el.value
    const caret = el.selectionStart ?? raw.length
    let digits = onlyDigits(raw)
    let digitsBeforeCaret = onlyDigits(raw.slice(0, caret)).length
    const native = event.nativeEvent
    const inputType = 'inputType' in native ? (native as InputEvent).inputType : ''

    // apagou só um separador (ex: ")" ou "-"): apaga o dígito vizinho
    if (digits === onlyDigits(value) && digits.length > 0) {
      if (inputType === 'deleteContentBackward' && digitsBeforeCaret > 0) {
        digits = digits.slice(0, digitsBeforeCaret - 1) + digits.slice(digitsBeforeCaret)
        digitsBeforeCaret -= 1
      } else if (inputType === 'deleteContentForward') {
        digits = digits.slice(0, digitsBeforeCaret) + digits.slice(digitsBeforeCaret + 1)
      }
    }

    const next = formatPhone(digits)
    onValueChange(next)
    const caretAtEnd = caret >= raw.length
    requestAnimationFrame(() => {
      if (document.activeElement !== el || caretAtEnd) return
      const position = caretAfterDigits(next, digitsBeforeCaret)
      el.setSelectionRange(position, position)
    })
  }

  return (
    <IconInput
      ref={ref}
      icon={Phone}
      type="tel"
      inputMode="tel"
      autoComplete="off"
      placeholder="(81) 99999-9999"
      value={value}
      onChange={handleChange}
      {...props}
    />
  )
})
