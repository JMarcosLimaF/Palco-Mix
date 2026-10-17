/**
 * Grade "bento" das categorias na Home: completa sempre as linhas.
 * Em cada breakpoint, as primeiras peças ocupam 2 colunas até não sobrar
 * buraco no fim da grade (ex.: 5 categorias em 4 colunas → [2][2] / [2][1][1]).
 */

export interface BentoLayout {
  /** classes de colunas da <ul> */
  grid: string
  /** classes de span de cada peça, na ordem */
  spans: string[]
}

// classes literais (o Tailwind precisa enxergá-las no código-fonte)
const MD_GRID: Record<number, string> = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3' }
const LG_GRID: Record<number, string> = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' }

function extraCells(count: number, cols: number) {
  return Math.ceil(count / cols) * cols - count
}

export function bentoLayout(count: number): BentoLayout {
  if (count <= 1) return { grid: 'grid-cols-1', spans: count === 1 ? ['col-span-1'] : [] }

  const mdCols = Math.min(3, count)
  const lgCols = Math.min(4, count)
  const baseExtra = extraCells(count, 2)
  const mdExtra = extraCells(count, mdCols)
  const lgExtra = extraCells(count, lgCols)

  const spans = Array.from({ length: count }, (_, i) =>
    [
      i < baseExtra ? 'col-span-2' : 'col-span-1',
      i < mdExtra ? 'md:col-span-2' : 'md:col-span-1',
      i < lgExtra ? 'lg:col-span-2' : 'lg:col-span-1',
    ].join(' '),
  )

  return { grid: ['grid-cols-2', MD_GRID[mdCols], LG_GRID[lgCols]].join(' '), spans }
}
