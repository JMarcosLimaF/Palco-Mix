/**
 * Expande a numeração textual em tamanhos individuais para os seletores:
 *   "34 ao 39"        → ["34","35","36","37","38","39"]
 *   "33/34 ao 39/40"  → ["33/34","35/36","37/38","39/40"]  (pares de chinelo)
 *   "37/43" | "37-43" → ["37",…,"43"]
 * Retorna null quando o texto não é uma faixa reconhecível (exiba o texto puro).
 */
export function expandSizes(sizes: string | undefined | null): string[] | null {
  if (!sizes) return null
  const text = sizes.trim().toLowerCase()

  const pairs = text.match(/^(\d{2})\s*\/\s*(\d{2})\s*(?:ao|a|até|-|–)\s*(\d{2})\s*\/\s*(\d{2})$/)
  if (pairs) {
    const [start, startEnd, last] = [Number(pairs[1]), Number(pairs[2]), Number(pairs[3])]
    const step = startEnd - start + 1
    if (step < 1 || step > 3 || last < start) return null
    const out: string[] = []
    for (let n = start; n <= last; n += step) out.push(`${n}/${n + step - 1}`)
    return out.length <= 20 ? out : null
  }

  const range = text.match(/^(?:do\s+)?(\d{1,2})\s*(?:ao|a|até|\/|-|–)\s*(\d{1,2})$/)
  if (range) {
    const [from, to] = [Number(range[1]), Number(range[2])]
    if (to < from || to - from > 20) return null
    return Array.from({ length: to - from + 1 }, (_, i) => String(from + i))
  }
  return null
}
