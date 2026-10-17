/** Limite de chips gerados (acima disso o texto é exibido como está). */
const MAX_SIZES = 24

// "Numeração: do 34 ao 39" → "34 ao 39"
const LABEL_PREFIX = /^numera[çc][ãa]o\s*:?\s*/
const FROM_PREFIX = /^d[eo]s?\s+/

const RANGE_WORD = String.raw`\s*(?:ao|a|à|até|ate|-|–|—)\s*`
const PAIR = String.raw`(\d{1,2})\s*\/\s*(\d{1,2})`
const ITEM = String.raw`\d{1,2}(?:\s*\/\s*\d{1,2})?`

const PAIR_RANGE = new RegExp(`^${PAIR}${RANGE_WORD}${PAIR}$`)
const SIMPLE_RANGE = new RegExp(String.raw`^(\d{1,2})(${RANGE_WORD}|\s*\/\s*)(\d{1,2})$`)
const LIST = new RegExp(String.raw`^${ITEM}(?:\s*(?:[,;]|\be\b)\s*${ITEM})+$`)
const LIST_SEPARATOR = /\s*(?:[,;]|\be\b)\s*/
const SINGLE = /^\d{1,2}$/

function range(from: number, to: number): string[] {
  return Array.from({ length: to - from + 1 }, (_, i) => String(from + i))
}

/** "33 / 34" → "33/34"; null se não for um par de números consecutivos. */
function pairLabel(item: string): string | null {
  const [a, b] = item.split('/').map((part) => Number(part.trim()))
  return b === a + 1 ? `${a}/${b}` : null
}

/**
 * Expande a numeração textual em tamanhos individuais. Regra única da loja
 * (SizePicker) e do admin (prévia "Na loja") — o texto precisa ser reconhecido
 * por inteiro, senão a loja mostra o texto original:
 *   "34 ao 39" · "do 34 ao 39" · "34 até 39" · "34-39" → ["34",…,"39"]
 *   "33/34 ao 39/40" → ["33/34","35/36","37/38","39/40"]  (pares de chinelo)
 *   "33/34"          → ["33/34"]                          (um par só)
 *   "37/43"          → ["37",…,"43"]
 *   "35, 36, 37" · "35; 36 e 37" → ["35","36","37"]
 *   "38"             → ["38"]
 * Retorna null quando o texto não é reconhecível (ex.: "34 ao 39 (sem 36)").
 */
export function expandSizes(sizes: string | undefined | null): string[] | null {
  if (!sizes) return null
  const text = sizes.trim().toLowerCase().replace(/\s+/g, ' ').replace(LABEL_PREFIX, '').replace(FROM_PREFIX, '')
  if (!text) return null

  const pairs = PAIR_RANGE.exec(text)
  if (pairs) {
    const [start, startEnd, last, lastEnd] = pairs.slice(1, 5).map(Number)
    const step = startEnd - start + 1
    // o par final precisa ter a mesma largura e cair na sequência
    if (step < 2 || step > 3 || lastEnd - last !== step - 1 || last < start || (last - start) % step !== 0) return null
    const out: string[] = []
    for (let n = start; n <= last; n += step) out.push(`${n}/${n + step - 1}`)
    return out.length <= MAX_SIZES ? out : null
  }

  const simple = SIMPLE_RANGE.exec(text)
  if (simple) {
    const [from, to] = [Number(simple[1]), Number(simple[3])]
    // "33/34" é um par único, não dois tamanhos
    if (simple[2].includes('/') && to === from + 1) return [`${from}/${to}`]
    if (from < 1 || to < from || to - from > 20) return null
    return range(from, to)
  }

  if (LIST.test(text)) {
    const out: string[] = []
    for (const item of text.split(LIST_SEPARATOR)) {
      const size = item.includes('/') ? pairLabel(item) : String(Number(item))
      if (!size || size === '0') return null
      if (!out.includes(size)) out.push(size)
    }
    out.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    return out.length <= MAX_SIZES ? out : null
  }

  if (SINGLE.test(text)) return Number(text) > 0 ? [String(Number(text))] : null
  return null
}
