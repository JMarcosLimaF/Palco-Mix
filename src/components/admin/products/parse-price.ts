/**
 * Conversão de preço digitado no admin ↔ número.
 *
 * Aceita os formatos que a equipe digita no dia a dia:
 *   "106" · "106,00" · "106.00" · "1.299,90" · "1299,9" · "R$ 89,90" · "1,299.90"
 */

/** Só os caracteres que fazem sentido num campo de preço. */
export function sanitizePriceTyping(raw: string): string {
  return raw.replace(/[^\d.,]/g, '')
}

export function isBlankPrice(raw: string): boolean {
  return raw.replace(/r\$|\s/gi, '') === ''
}

/**
 * Texto → número (arredondado a centavos).
 * Retorna `undefined` para vazio e `NaN` para formato inválido.
 */
export function parsePrice(raw: string): number | undefined {
  const s = raw.replace(/r\$|\s/gi, '')
  if (!s) return undefined
  if (!/^[\d.,]+$/.test(s)) return Number.NaN

  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  let normalized: string

  if (lastComma >= 0 && lastDot >= 0) {
    // os dois separadores: o último é o decimal, o outro é milhar
    const dec = Math.max(lastComma, lastDot)
    normalized = `${s.slice(0, dec).replace(/[.,]/g, '')}.${s.slice(dec + 1)}`
  } else if (lastComma >= 0) {
    // só vírgula: decimal (mais de uma vírgula é inválido)
    if (s.indexOf(',') !== lastComma) return Number.NaN
    normalized = s.replace(',', '.')
  } else if (lastDot >= 0) {
    const parts = s.split('.')
    const groupsOfThree = parts.length > 1 && parts.slice(1).every((p) => p.length === 3)
    if (groupsOfThree) {
      // "1.299" / "1.299.000" → ponto como milhar
      normalized = parts.join('')
    } else if (parts.length === 2) {
      normalized = s
    } else {
      return Number.NaN
    }
  } else {
    normalized = s
  }

  if (!/^(\d+\.?\d*|\.\d+)$/.test(normalized)) return Number.NaN
  const n = Number(normalized)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : Number.NaN
}

/** Número válido e maior que zero? */
export function isValidPrice(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

const inputFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 1299.9 → "1.299,90" (valor exibido no campo, sem o "R$"). */
export function formatPriceInput(value: number | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? inputFmt.format(value) : ''
}
