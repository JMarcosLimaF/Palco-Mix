/**
 * Métricas do painel e ferramentas do banco local (backup, restauração,
 * massa de dados para teste de desempenho).
 */
import { localDb, StorageQuotaError } from '@/lib/db/local-db'
import { validateCatalogData } from '@/lib/db/validate'
import { hasPromo } from '@/lib/utils'
import type { CatalogData, DashboardStats, Product } from '@/types/catalog'
import { ServiceError } from './errors'

/** Prefixo dos produtos sintéticos de teste de carga. */
export const STRESS_ID_PREFIX = 'pm-t'

export const adminService = {
  async stats(): Promise<DashboardStats> {
    const { products, categories, distributors } = localDb.get()
    const byCat = new Map<string, number>()
    const byDist = new Map<string, number>()
    let active = 0
    let featured = 0
    let onSale = 0
    for (const p of products) {
      if (p.status === 'active') active++
      // só destaques ativos aparecem no carrossel/vitrine da loja
      if (p.isFeatured && p.status === 'active') featured++
      if (hasPromo(p)) onSale++
      byCat.set(p.category, (byCat.get(p.category) ?? 0) + 1)
      byDist.set(p.distributor, (byDist.get(p.distributor) ?? 0) + 1)
    }
    return {
      totalProducts: products.length,
      activeProducts: active,
      inactiveProducts: products.length - active,
      featuredProducts: featured,
      onSaleProducts: onSale,
      totalCategories: categories.length,
      totalDistributors: distributors.length,
      productsByCategory: categories
        .map((c) => ({ id: c.id, name: c.name, count: byCat.get(c.id) ?? 0 }))
        .sort((a, b) => b.count - a.count),
      productsByDistributor: distributors
        .map((d) => ({ id: d.id, name: d.name, count: byDist.get(d.id) ?? 0 }))
        .sort((a, b) => b.count - a.count),
      recentProducts: [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    }
  },

  storageInfo(): { bytes: number; pristine: boolean; quotaExceeded: boolean } {
    return { bytes: localDb.usageBytes(), pristine: localDb.isPristine(), quotaExceeded: localDb.quotaExceeded() }
  },

  /** JSON formatado do banco atual (mesmo formato de src/data/db.json). */
  exportJson(): string {
    return JSON.stringify(localDb.get(), null, 2)
  },

  /** Lê e valida um backup sem gravar nada (prévia da importação). */
  parseBackup(json: string): CatalogData {
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      throw new ServiceError('validation', 'O arquivo não é um JSON válido.')
    }
    const result = validateCatalogData(parsed)
    if (!result.ok) throw new ServiceError('validation', `Arquivo inválido. ${result.error}`)
    return result.data
  },

  async importJson(json: string): Promise<CatalogData> {
    localDb.replace(adminService.parseBackup(json))
    return localDb.get()
  },

  async reset(): Promise<void> {
    localDb.reset()
  },

  /**
   * Gera `count` produtos sintéticos reaproveitando imagens/categorias reais,
   * para validar busca, filtros e paginação com milhares de itens.
   */
  async generateStressData(count: number): Promise<number> {
    const data = localDb.get()
    const base = data.products.filter((p) => !p.id.startsWith(STRESS_ID_PREFIX))
    if (base.length === 0) return 0
    // imagens enviadas viram data URL (~100 KB cada): replicadas em milhares de itens estourariam a cota
    const isStatic = (path: string) => !path.startsWith('data:')
    const fallbackImage = base.flatMap((p) => p.images).find(isStatic)
    const now = Date.now()
    const synthetic: Product[] = Array.from({ length: count }, (_, i) => {
      const src = base[i % base.length]
      const factor = 0.85 + ((i * 37) % 40) / 100
      const price = Math.round(src.price * factor * 100) / 100
      // preço à vista (10% off) em parte dos itens; sob consulta (price 0) nunca tem
      const promo = price > 0 && i % 7 === 0 ? Math.round(price * 0.9 * 100) / 100 : undefined
      return {
        ...src,
        id: `${STRESS_ID_PREFIX}${String(i + 1).padStart(5, '0')}`,
        name: `${src.name} · Lote ${Math.floor(i / base.length) + 1}`,
        // descrição curta mantém milhares de itens dentro da cota do localStorage
        description: 'Produto sintético gerado para teste de carga.',
        images: [src.images.find(isStatic) ?? fallbackImage].filter((path): path is string => Boolean(path)),
        price,
        promoPrice: promo,
        isFeatured: false,
        status: i % 11 === 0 ? 'inactive' : 'active',
        createdAt: new Date(now - (i + 1) * 3600_000 * 6).toISOString(),
        updatedAt: undefined,
        tags: [...(src.tags ?? []), 'teste-de-carga'],
      }
    })
    try {
      localDb.commit({ ...data, products: [...base, ...synthetic] })
    } catch (error) {
      if (error instanceof StorageQuotaError) {
        throw new ServiceError(
          'storage',
          'Os produtos de teste não couberam no armazenamento do navegador. Tente uma quantidade menor ou remova os produtos de teste.',
        )
      }
      throw error
    }
    return synthetic.length
  },

  async clearStressData(): Promise<number> {
    const data = localDb.get()
    const products = data.products.filter((p) => !p.id.startsWith(STRESS_ID_PREFIX))
    localDb.commit({ ...data, products })
    return data.products.length - products.length
  },
}
