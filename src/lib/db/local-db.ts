/**
 * Banco local (localStorage) do catálogo — modo desenvolvimento/demonstração.
 *
 * - Primeira carga: usa o seed `src/data/db.json` com as datas reais (o selo
 *   "Novo" e "Lançamentos" refletem quando cada produto entrou de fato).
 * - Escritas: persistem o snapshot inteiro em `palcomix:db` (só após a 1ª alteração).
 * - Leitura/importação validam item a item (`validate.ts`): banco salvo inválido
 *   cai no seed em vez de quebrar a loja.
 * - Sincroniza entre abas via evento `storage`.
 *
 * A UI nunca fala com este módulo diretamente: use `src/services/*`.
 * Trocar por Supabase/API = reimplementar os services, sem tocar nas telas.
 */
import seed from '@/data/db.json'
import type { CatalogData } from '@/types/catalog'
import { validateCatalogData } from './validate'

export { DB_SCHEMA_VERSION } from './validate'
export const DB_STORAGE_KEY = 'palcomix:db'

export class StorageQuotaError extends Error {
  constructor() {
    super('O armazenamento local do navegador está cheio. Remova imagens enviadas ou restaure os dados iniciais.')
    this.name = 'StorageQuotaError'
  }
}

type Listener = () => void

function fromSeed(): CatalogData {
  return structuredClone(seed) as CatalogData
}

function readStorage(): CatalogData | null {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY)
    if (!raw) return null
    const result = validateCatalogData(JSON.parse(raw))
    if (result.ok) return result.data
    console.warn(`[palcomix] banco local inválido, usando os dados iniciais. ${result.error}`)
    return null
  } catch {
    return null
  }
}

class LocalDb {
  private data: CatalogData
  private listeners = new Set<Listener>()
  /** Uma gravação já estourou a cota nesta sessão (o limite real varia por navegador). */
  private quotaHit = false

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
        this.quotaHit = true
        throw new StorageQuotaError()
      }
      throw error
    }
    // gravou: o aviso de cota cheia deixa de valer
    this.quotaHit = false
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
    this.quotaHit = false
    this.data = fromSeed()
    this.emit()
  }

  /** Substitui todo o banco (importação de backup). */
  replace(data: unknown): void {
    const result = validateCatalogData(data)
    if (!result.ok) throw new Error(`Arquivo inválido. ${result.error}`)
    this.commit(result.data)
  }

  /** Bytes ocupados no localStorage pelo banco (UTF-16: 2 por caractere — estimativa). */
  usageBytes(): number {
    try {
      return (localStorage.getItem(DB_STORAGE_KEY)?.length ?? 0) * 2
    } catch {
      return 0
    }
  }

  /** Alguma gravação desta sessão foi recusada por falta de espaço? */
  quotaExceeded(): boolean {
    return this.quotaHit
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
