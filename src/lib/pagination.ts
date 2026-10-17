/** Gera a sequência de páginas com reticências: [1, '…', 4, 5, 6, '…', 20] */
export function pageWindow(page: number, pageCount: number, siblings = 1): Array<number | 'gap'> {
  const total = siblings * 2 + 5
  if (pageCount <= total) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const start = Math.max(2, page - siblings)
  const end = Math.min(pageCount - 1, page + siblings)
  const out: Array<number | 'gap'> = [1]
  if (start > 2) out.push('gap')
  for (let i = start; i <= end; i++) out.push(i)
  if (end < pageCount - 1) out.push('gap')
  out.push(pageCount)
  return out
}
