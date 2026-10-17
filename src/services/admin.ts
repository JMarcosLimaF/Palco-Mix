/**
 * Métricas do painel e ferramentas do banco local (backup, restauração,
 * massa de dados para teste de desempenho).
 */
import { localDb } from '@/lib/db/local-db'
import { hasPromo } from '@/lib/utils'
import type { CatalogData, DashboardStats, Product } from '@/types/catalog'

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
      if (p.isFeatured) featured++
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

  storageInfo(): { bytes: number; pristine: boolean } {
    return { bytes: localDb.usageBytes(), pristine: localDb.isPristine() }
  },

  /** JSON formatado do banco atual (mesmo formato de src/data/db.json). */
  exportJson(): string {
    return JSON.stringify(localDb.get(), null, 2)
  },

  async importJson(json: string): Promise<CatalogData> {
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      throw new Error('O arquivo não é um JSON válido.')
    }
    localDb.replace(parsed)
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
    const now = Date.now()
    const synthetic: Product[] = Array.from({ length: count }, (_, i) => {
      const src = base[i % base.length]
      const factor = 0.85 + ((i * 37) % 40) / 100
      const price = Math.round(src.price * factor * 100) / 100
      const promo = i % 7 === 0 ? Math.round(price * 0.9 * 100) / 100 : undefined
      return {
        ...src,
        id: `${STRESS_ID_PREFIX}${String(i + 1).padStart(5, '0')}`,
        name: `${src.name} · Lote ${Math.floor(i / base.length) + 1}`,
        // descrição curta mantém milhares de itens dentro da cota do localStorage
        description: 'Produto sintético gerado para teste de carga.',
        images: src.images.slice(0, 1),
        price,
        promoPrice: promo,
        isFeatured: false,
        status: i % 11 === 0 ? 'inactive' : 'active',
        createdAt: new Date(now - (i + 1) * 3600_000 * 6).toISOString(),
        updatedAt: undefined,
        tags: [...(src.tags ?? []), 'teste-de-carga'],
      }
    })
    localDb.commit({ ...data, products: [...base, ...synthetic] })
    return synthetic.length
  },

  async clearStressData(): Promise<number> {
    const data = localDb.get()
    const products = data.products.filter((p) => !p.id.startsWith(STRESS_ID_PREFIX))
    localDb.commit({ ...data, products })
    return data.products.length - products.length
  },
}
