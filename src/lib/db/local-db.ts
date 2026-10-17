/**
 * Banco local (localStorage) do catálogo — modo desenvolvimento/demonstração.
 *
 * - Primeira carga: usa o seed `src/data/db.json` (datas rebaseadas para "agora",
 *   assim os selos "Novo" e "Lançamentos" continuam fazendo sentido).
 * - Escritas: persistem o snapshot inteiro em `palcomix:db` (só após a 1ª alteração).
 * - Sincroniza entre abas via evento `storage`.
 *
 * A UI nunca fala com este módulo diretamente: use `src/services/*`.
 * Trocar por Supabase/API = reimplementar os services, sem tocar nas telas.
 */
import seed from '@/data/db.json'
import type { CatalogData } from '@/types/catalog'

export const DB_STORAGE_KEY = 'palcomix:db'
export const DB_SCHEMA_VERSION = 1

export class StorageQuotaError extends Error {
  constructor() {
    super('O armazenamento local do navegador está cheio. Remova imagens enviadas ou restaure os dados iniciais.')
    this.name = 'StorageQuotaError'
  }
}

type Listener = () => void

function isCatalogData(value: unknown): value is CatalogData {
  const v = value as CatalogData
  return (
    !!v &&
    v.schemaVersion === DB_SCHEMA_VERSION &&
    Array.isArray(v.products) &&
    Array.isArray(v.categories) &&
    Array.isArray(v.distributors)
  )
}

/** Desloca as datas do seed para que o item mais recente seja "agora". */
function rebaseSeedDates(data: CatalogData, now = Date.now()): CatalogData {
  const times = data.products.map((p) => new Date(p.createdAt).getTime()).filter((t) => !Number.isNaN(t))
  if (times.length === 0) return data
  const delta = now - 60 * 60 * 1000 - Math.max(...times)
  const shift = (iso: string) => {
    const t = new Date(iso).getTime()
    return Number.isNaN(t) ? iso : new Date(t + delta).toISOString()
  }
  return {
    ...data,
    products: data.products.map((p) => ({ ...p, createdAt: shift(p.createdAt) })),
    categories: data.categories.map((c) => ({ ...c, createdAt: shift(c.createdAt) })),
    distributors: data.distributors.map((d) => ({ ...d, createdAt: shift(d.createdAt) })),
  }
}

function fromSeed(): CatalogData {
  return rebaseSeedDates(structuredClone(seed) as CatalogData)
}

function readStorage(): CatalogData | null {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isCatalogData(parsed) ? parsed : null
  } catch {
    return null
  }
}

class LocalDb {
  private data: CatalogData
  private listeners = new Set<Listener>()

  constructor() {
    this.data = readStorage() ?? fromSeed()
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key !== DB_STORAGE_KEY) return
        this.data = readStorage() ?? fromSeed()
        this.emit()
      })
    }
  }

  /** Snapshot imutável atual. Nunca mute o retorno — use `commit`. */
  get(): CatalogData {
    return this.data
  }

  /** Persiste um novo snapshot. Lança `StorageQuotaError` se não couber. */
  commit(next: CatalogData): void {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(next))
    } catch (error) {
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
        throw new StorageQuotaError()
      }
      throw error
    }
    this.data = next
    this.emit()
  }

  /** Aplica uma transformação ao snapshot atual e persiste. */
  update(mutator: (current: CatalogData) => CatalogData): CatalogData {
    const next = mutator(this.data)
    this.commit(next)
    return next
  }

  /** Descarta alterações locais e volta ao seed. */
  reset(): void {
    localStorage.removeItem(DB_STORAGE_KEY)
    this.data = fromSeed()
    this.emit()
  }

  /** Substitui todo o banco (importação de backup). */
  replace(data: unknown): void {
    if (!isCatalogData(data)) throw new Error('Arquivo inválido: estrutura do banco não reconhecida.')
    this.commit(data)
  }

  /** Bytes ocupados no localStorage pelo banco. */
  usageBytes(): number {
    try {
      return (localStorage.getItem(DB_STORAGE_KEY)?.length ?? 0) * 2
    } catch {
      return 0
    }
  }

  isPristine(): boolean {
    try {
      return localStorage.getItem(DB_STORAGE_KEY) === null
    } catch {
      return true
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit() {
    this.listeners.forEach((l) => l())
  }
}

export const localDb = new LocalDb()
