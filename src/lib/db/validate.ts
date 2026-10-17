/**
 * Validação do banco do catálogo, item a item (importação de backup e leitura
 * do localStorage). Um JSON malformado nunca chega às telas: a mensagem cita o
 * 1º item inválido, ex.: 'Produto nº 12 (id 101): o campo "id" deve ser um texto não vazio.'
 *
 * Campos desconhecidos são preservados (compatibilidade com versões futuras);
 * campos opcionais com `null` são removidos.
 */
import type { CatalogData } from '@/types/catalog'

export const DB_SCHEMA_VERSION = 1

export type CatalogValidation = { ok: true; data: CatalogData } | { ok: false; error: string }

type Raw = Record<string, unknown>

interface FieldRule {
  key: string
  test: (value: unknown) => boolean
  /** complemento de "deve ser …" */
  expect: string
  optional?: boolean
}

const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v)
const isText = (v: unknown): v is string => typeof v === 'string'
const isFilledText = (v: unknown) => isText(v) && v.trim() !== ''
const isName = (v: unknown) => isText(v) && v.trim().length >= 2
const isDate = (v: unknown) => isText(v) && v.trim() !== '' && !Number.isNaN(new Date(v).getTime())
const isTextList = (v: unknown) => Array.isArray(v) && v.every(isText)
const isPrice = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0

const TEXT = 'um texto'
const DATE = 'uma data válida (ISO 8601)'
const TEXT_LIST = 'uma lista de textos'

const ENTITY_RULES: FieldRule[] = [
  { key: 'id', test: isFilledText, expect: 'um texto não vazio' },
  { key: 'name', test: isName, expect: 'um texto com pelo menos 2 caracteres' },
  { key: 'createdAt', test: isDate, expect: DATE },
  { key: 'description', test: isText, expect: TEXT, optional: true },
  { key: 'updatedAt', test: isDate, expect: DATE, optional: true },
]

const CATEGORY_RULES: FieldRule[] = [...ENTITY_RULES, { key: 'image', test: isText, expect: TEXT, optional: true }]

const DISTRIBUTOR_RULES: FieldRule[] = [
  ...ENTITY_RULES,
  { key: 'phone', test: isText, expect: TEXT, optional: true },
  { key: 'email', test: isText, expect: TEXT, optional: true },
  { key: 'website', test: isText, expect: TEXT, optional: true },
]

const GENDERS: readonly unknown[] = ['feminino', 'masculino', 'infantil', 'unissex']

const PRODUCT_RULES: FieldRule[] = [
  ...ENTITY_RULES,
  // price = preço a prazo (0 = sob consulta); promoPrice = preço à vista
  { key: 'price', test: isPrice, expect: 'um número maior ou igual a zero' },
  { key: 'promoPrice', test: isPrice, expect: 'um número maior ou igual a zero', optional: true },
  { key: 'category', test: isFilledText, expect: 'o id (texto) de uma categoria' },
  { key: 'distributor', test: isFilledText, expect: 'o id (texto) de um distribuidor' },
  { key: 'images', test: isTextList, expect: 'uma lista de caminhos de imagem (textos)' },
  { key: 'isFeatured', test: (v) => typeof v === 'boolean', expect: 'true ou false' },
  { key: 'status', test: (v) => v === 'active' || v === 'inactive', expect: '"active" ou "inactive"' },
  { key: 'sizes', test: isText, expect: TEXT, optional: true },
  { key: 'colors', test: isTextList, expect: TEXT_LIST, optional: true },
  {
    key: 'gender',
    test: (v) => GENDERS.includes(v),
    expect: 'feminino, masculino, infantil ou unissex',
    optional: true,
  },
  { key: 'tags', test: isTextList, expect: TEXT_LIST, optional: true },
]

class InvalidCatalog extends Error {}

/** 'Produto nº 12 (id 101)' — posição 1-based, como numa planilha. */
function describe(kind: string, index: number, item: Raw): string {
  const id = typeof item.id === 'string' || typeof item.id === 'number' ? ` (id ${String(item.id)})` : ''
  return `${kind} nº ${index + 1}${id}`
}

function checkList(kind: string, list: unknown[], rules: FieldRule[]): Raw[] {
  const seen = new Set<string>()
  return list.map((value, index) => {
    if (!isObject(value)) throw new InvalidCatalog(`${kind} nº ${index + 1}: o item deve ser um objeto.`)
    const item: Raw = { ...value }
    for (const rule of rules) {
      const field = item[rule.key]
      if (rule.optional && (field === undefined || field === null)) {
        delete item[rule.key]
        continue
      }
      if (!rule.test(field)) {
        throw new InvalidCatalog(`${describe(kind, index, value)}: o campo "${rule.key}" deve ser ${rule.expect}.`)
      }
    }
    const id = item.id as string
    if (seen.has(id)) throw new InvalidCatalog(`${describe(kind, index, value)}: id repetido.`)
    seen.add(id)
    return item
  })
}

/** Confere estrutura e itens do banco. Nunca lança: devolve o erro legível. */
export function validateCatalogData(value: unknown): CatalogValidation {
  if (!isObject(value)) return { ok: false, error: 'O conteúdo não é um banco do catálogo.' }
  if (value.schemaVersion !== DB_SCHEMA_VERSION) {
    return { ok: false, error: `Versão do banco não suportada (esperada: ${DB_SCHEMA_VERSION}).` }
  }
  const { products, categories, distributors, productSeq } = value
  if (!Array.isArray(products) || !Array.isArray(categories) || !Array.isArray(distributors)) {
    return { ok: false, error: 'Faltam as listas de produtos, categorias ou distribuidores.' }
  }
  const hasSeq = productSeq !== undefined && productSeq !== null
  if (hasSeq && !(Number.isInteger(productSeq) && (productSeq as number) >= 0)) {
    return { ok: false, error: 'O campo "productSeq" deve ser um número inteiro maior ou igual a zero.' }
  }

  try {
    const data: Raw = {
      ...value,
      categories: checkList('Categoria', categories, CATEGORY_RULES),
      distributors: checkList('Distribuidor', distributors, DISTRIBUTOR_RULES),
      // descrição é obrigatória no tipo, mas pode faltar num JSON feito à mão
      products: checkList('Produto', products, PRODUCT_RULES).map((p) =>
        isText(p.description) ? p : { ...p, description: '' },
      ),
    }
    if (!hasSeq) delete data.productSeq
    return { ok: true, data: data as unknown as CatalogData }
  } catch (error) {
    if (error instanceof InvalidCatalog) return { ok: false, error: error.message }
    throw error
  }
}
