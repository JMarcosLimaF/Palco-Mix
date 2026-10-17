/**
 * Modelos de domínio do catálogo Palco Mix.
 *
 * `Product` segue o contrato do briefing; os campos marcados como
 * "extensão" são opcionais e enriquecem busca/filtros sem quebrar o contrato.
 */

export type ProductStatus = 'active' | 'inactive'

export type Gender = 'feminino' | 'masculino' | 'infantil' | 'unissex'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  promoPrice?: number
  /** id da categoria (ver `Category.id`) */
  category: string
  /** id do distribuidor/marca (ver `Distributor.id`) */
  distributor: string
  /** Caminhos relativos ('/produtos/exemplo.jpg') ou data URLs de upload local */
  images: string[]
  /** Vai para o carrossel principal e a vitrine de destaques */
  isFeatured: boolean
  status: ProductStatus
  /** ISO 8601 */
  createdAt: string

  // ---- extensões opcionais ----
  /** Numeração, ex: "34 ao 39" */
  sizes?: string
  colors?: string[]
  gender?: Gender
  /** Palavras-chave extras para a busca */
  tags?: string[]
  updatedAt?: string
}

export interface Category {
  id: string
  name: string
  description?: string
  /** Imagem de capa (caminho em /produtos/) */
  image?: string
  createdAt: string
  updatedAt?: string
}

export interface Distributor {
  id: string
  name: string
  description?: string
  phone?: string
  email?: string
  website?: string
  createdAt: string
  updatedAt?: string
}

export type ProductSort = 'relevance' | 'recent' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'

export interface ProductQuery {
  search?: string
  /** ids de categoria (OR entre si) */
  categories?: string[]
  /** ids de distribuidor (OR entre si) */
  distributors?: string[]
  minPrice?: number
  maxPrice?: number
  featured?: boolean
  /** Somente com preço promocional */
  onSale?: boolean
  /** 'active' (padrão, vitrine pública) | 'inactive' | 'all' (admin) */
  status?: ProductStatus | 'all'
  sort?: ProductSort
  /** 1-based */
  page?: number
  pageSize?: number
}

export interface ProductFacets {
  /** contagem por categoria considerando os demais filtros */
  categories: Record<string, number>
  /** contagem por distribuidor considerando os demais filtros */
  distributors: Record<string, number>
  /** faixa de preço efetivo (promo ?? price) considerando os demais filtros */
  priceRange: { min: number; max: number }
}

export interface ProductQueryResult {
  items: Product[]
  total: number
  page: number
  pageSize: number
  pageCount: number
  facets: ProductFacets
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
export type CategoryInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
export type DistributorInput = Omit<Distributor, 'id' | 'createdAt' | 'updatedAt'>

export interface CatalogData {
  schemaVersion: number
  categories: Category[]
  distributors: Distributor[]
  products: Product[]
}

export interface DashboardStats {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  featuredProducts: number
  onSaleProducts: number
  totalCategories: number
  totalDistributors: number
  productsByCategory: Array<{ id: string; name: string; count: number }>
  productsByDistributor: Array<{ id: string; name: string; count: number }>
  recentProducts: Product[]
}
