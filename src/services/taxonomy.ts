/**
 * Serviços de Categorias e Distribuidores (mesma regra de negócio):
 * - id = slug do nome na criação (estável: renomear não quebra produtos);
 * - nomes únicos (ignorando acento/caixa);
 * - exclusão bloqueada se houver produtos vinculados, a menos que se
 *   informe `reassignTo` para mover os produtos antes de excluir.
 */
import { localDb } from '@/lib/db/local-db'
import { normalizeText, slugify } from '@/lib/utils'
import type { CatalogData, Category, CategoryInput, Distributor, DistributorInput } from '@/types/catalog'
import { ServiceError } from './errors'

type Kind = 'categories' | 'distributors'
type Entity<K extends Kind> = K extends 'categories' ? Category : Distributor
type Input<K extends Kind> = K extends 'categories' ? CategoryInput : DistributorInput

const LABEL: Record<Kind, { one: string; field: 'category' | 'distributor'; article: string }> = {
  categories: { one: 'categoria', field: 'category', article: 'esta' },
  distributors: { one: 'distribuidor', field: 'distributor', article: 'este' },
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' })

function uniqueId(name: string, taken: Set<string>): string {
  const base = slugify(name) || 'item'
  let id = base
  let i = 2
  while (taken.has(id)) id = `${base}-${i++}`
  return id
}

function cleanInput<K extends Kind>(input: Input<K>): Input<K> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      const v = value.trim()
      if (v) out[key] = v
    } else if (value !== undefined && value !== null) {
      out[key] = value
    }
  }
  return out as Input<K>
}

function createTaxonomyService<K extends Kind>(kind: K) {
  const label = LABEL[kind]
  const items = (data: CatalogData) => data[kind] as Entity<K>[]

  function assertName(name: string | undefined, data: CatalogData, ignoreId?: string) {
    const n = normalizeText(name ?? '')
    if (n.length < 2) throw new ServiceError('validation', `Informe o nome d${label.one === 'categoria' ? 'a' : 'o'} ${label.one}.`)
    if (items(data).some((e) => e.id !== ignoreId && normalizeText(e.name) === n)) {
      throw new ServiceError('conflict', `Já existe ${label.one === 'categoria' ? 'uma' : 'um'} ${label.one} com esse nome.`)
    }
  }

  return {
    async list(): Promise<Entity<K>[]> {
      return [...items(localDb.get())].sort((a, b) => collator.compare(a.name, b.name))
    },

    async getById(id: string): Promise<Entity<K> | null> {
      return items(localDb.get()).find((e) => e.id === id) ?? null
    },

    /** Quantidade de produtos (todos os status) por id. */
    async usage(): Promise<Record<string, number>> {
      const counts: Record<string, number> = {}
      for (const p of localDb.get().products) counts[p[label.field]] = (counts[p[label.field]] ?? 0) + 1
      return counts
    },

    async create(input: Input<K>): Promise<Entity<K>> {
      const data = localDb.get()
      const clean = cleanInput(input)
      assertName(clean.name, data)
      const now = new Date().toISOString()
      const entity = {
        ...clean,
        id: uniqueId(clean.name, new Set(items(data).map((e) => e.id))),
        createdAt: now,
        updatedAt: now,
      } as Entity<K>
      localDb.commit({ ...data, [kind]: [...items(data), entity] })
      return entity
    },

    async update(id: string, input: Input<K>): Promise<Entity<K>> {
      const data = localDb.get()
      const current = items(data).find((e) => e.id === id)
      if (!current) throw new ServiceError('not_found', `${label.one[0].toUpperCase()}${label.one.slice(1)} não encontrado(a).`)
      const clean = cleanInput(input)
      assertName(clean.name, data, id)
      const entity = { ...clean, id, createdAt: current.createdAt, updatedAt: new Date().toISOString() } as Entity<K>
      localDb.commit({ ...data, [kind]: items(data).map((e) => (e.id === id ? entity : e)) })
      return entity
    },

    /**
     * Exclui. Se houver produtos vinculados, exige `reassignTo` (id destino),
     * caso contrário lança ServiceError('in_use').
     */
    async remove(id: string, options: { reassignTo?: string } = {}): Promise<{ moved: number }> {
      const data = localDb.get()
      if (!items(data).some((e) => e.id === id)) throw new ServiceError('not_found', `Registro não encontrado.`)
      const linked = data.products.filter((p) => p[label.field] === id)

      if (linked.length > 0) {
        const target = options.reassignTo
        if (!target) {
          throw new ServiceError(
            'in_use',
            `${linked.length} produto(s) usam ${label.article} ${label.one}. Escolha para onde movê-los antes de excluir.`,
          )
        }
        if (target === id || !items(data).some((e) => e.id === target)) {
          throw new ServiceError('validation', `Selecione ${label.one === 'categoria' ? 'outra' : 'outro'} ${label.one} de destino.`)
        }
      }

      const now = new Date().toISOString()
      localDb.commit({
        ...data,
        [kind]: items(data).filter((e) => e.id !== id),
        products: linked.length
          ? data.products.map((p) => (p[label.field] === id ? { ...p, [label.field]: options.reassignTo, updatedAt: now } : p))
          : data.products,
      })
      return { moved: linked.length }
    },
  }
}

export const categoryService = createTaxonomyService('categories')
export const distributorService = createTaxonomyService('distributors')
