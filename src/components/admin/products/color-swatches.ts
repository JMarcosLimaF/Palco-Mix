import { normalizeText } from '@/lib/utils'

/** Amostras de cor para os chips de "Cores" (nomes comuns em calçados). */
const SWATCHES: Record<string, string> = {
  preto: '#0d0d0d',
  preta: '#0d0d0d',
  branco: '#ffffff',
  branca: '#ffffff',
  'off white': '#f3eee3',
  offwhite: '#f3eee3',
  gelo: '#eef1f4',
  creme: '#f1e6cc',
  bege: '#d9c3a0',
  areia: '#d8c4a0',
  nude: '#e3bc9a',
  caramelo: '#b5712f',
  camel: '#b5803f',
  marrom: '#6b4226',
  cafe: '#4b2e1e',
  chocolate: '#4b2e1e',
  conhaque: '#8a4b22',
  whisky: '#9a5b25',
  vinho: '#6d1a2b',
  bordo: '#6d1a2b',
  vermelho: '#dc2626',
  vermelha: '#dc2626',
  rosa: '#f472b6',
  pink: '#ec4899',
  lilas: '#c4a5e8',
  roxo: '#7c3aed',
  azul: '#0066ff',
  marinho: '#1e2a4a',
  'azul marinho': '#1e2a4a',
  jeans: '#4a6a95',
  verde: '#16a34a',
  'verde militar': '#4b5320',
  militar: '#4b5320',
  amarelo: '#facc15',
  mostarda: '#d4a017',
  laranja: '#f97316',
  cinza: '#9ca3af',
  grafite: '#3f3f46',
  chumbo: '#52525b',
  prata: '#c0c4cc',
  dourado: '#d4af37',
  ouro: '#d4af37',
  bronze: '#a97142',
  cobre: '#b87333',
}

/** Cor CSS para o nome informado, ou undefined quando desconhecida. */
export function colorSwatch(name: string): string | undefined {
  const key = normalizeText(name)
  return SWATCHES[key] ?? SWATCHES[key.split(' ')[0]]
}
