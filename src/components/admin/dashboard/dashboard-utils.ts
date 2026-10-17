/** Formatação usada no painel (pt-BR). */

const longDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** "Sábado, 17 de outubro de 2026" */
export function formatLongDate(date: Date): string {
  const text = longDate.format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** 1234 → "1.234" */
export function formatCount(value: number): string {
  return value.toLocaleString('pt-BR')
}

/** Participação percentual legível: 0 → "0%", 0,3% → "<1%", 37,6% → "38%". */
export function formatShare(part: number, total: number): string {
  if (total <= 0 || part <= 0) return '0%'
  const pct = (part / total) * 100
  if (pct < 1) return '<1%'
  return `${Math.round(pct)}%`
}

/** Largura relativa (0–1) de uma barra em relação ao maior valor da lista. */
export function barRatio(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0
  return Math.max(0.02, Math.min(1, value / max))
}
