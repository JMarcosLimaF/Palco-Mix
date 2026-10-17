/**
 * /admin/painel — visão geral do catálogo: métricas rápidas, distribuição
 * por categoria/distribuidor, últimos cadastros e atalhos.
 */
import { BadgePercent, CircleAlert, Plus, Star, Tags, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { BarListPanel } from '@/components/admin/dashboard/bar-list-panel'
import { formatCount, formatLongDate, formatShare } from '@/components/admin/dashboard/dashboard-utils'
import { QuickActionsPanel, QuickActionsRail } from '@/components/admin/dashboard/quick-actions-panel'
import { RecentProductsPanel } from '@/components/admin/dashboard/recent-products-panel'
import {
  StatCard,
  StatCardSkeleton,
  TotalProductsCard,
  TotalProductsCardSkeleton,
} from '@/components/admin/dashboard/stat-cards'
import { useDashboardStats } from '@/components/admin/dashboard/use-dashboard-stats'
import { firstName } from '@/components/admin/layout/admin-nav-items'
import { HERO_FEATURED_LIMIT } from '@/components/home/hero-shared'
import { AdminPageHeader, Panel } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { EmptyState } from '@/components/ui/feedback'
import { useCatalogLookups } from '@/hooks/catalog'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useMediaQuery } from '@/hooks/use-media-query'
import { errorMessage } from '@/services/errors'
import { useAuthStore } from '@/store/auth'

const CATEGORY_NOUN = { singular: 'categoria', plural: 'categorias' }
const DISTRIBUTOR_NOUN = { singular: 'distribuidor', plural: 'distribuidores' }
// filtros aceitos pela listagem do admin (/admin/produtos?categoria=…&distribuidor=…)
const categoryProductsHref = (id: string) => `/admin/produtos?categoria=${encodeURIComponent(id)}`
const distributorProductsHref = (id: string) => `/admin/produtos?distribuidor=${encodeURIComponent(id)}`

/** O carrossel da Home mostra só os destaques ativos mais recentes (até HERO_FEATURED_LIMIT). */
function featuredCaption(activeFeatured: number): string {
  if (activeFeatured === 0) return 'Nenhum ativo no carrossel da loja'
  if (activeFeatured <= HERO_FEATURED_LIMIT) return 'Ativos · todos no carrossel'
  return `Ativos · ${formatCount(HERO_FEATURED_LIMIT)} mais recentes no carrossel`
}

export default function DashboardPage() {
  useDocumentTitle('Painel · Admin')
  const userName = useAuthStore((s) => s.user?.name)
  const stats = useDashboardStats()
  const { categoryName } = useCatalogLookups()
  const [today] = useState(() => new Date())
  // celular: rankings mais curtos (o resto vira a linha "+ N …" do rodapé do painel)
  const wide = useMediaQuery('(min-width: 640px)')
  const barLimit = wide ? 8 : 5

  const data = stats.data
  const loading = stats.isPending
  const usedCategories = data?.productsByCategory.filter((c) => c.count > 0).length ?? 0
  const usedDistributors = data?.productsByDistributor.filter((d) => d.count > 0).length ?? 0

  return (
    <div className="flex flex-col gap-5 sm:gap-6 lg:gap-8">
      <AdminPageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="size-1.5 rounded-full bg-brand-500" aria-hidden />
            {formatLongDate(today)}
          </span>
        }
        title={`Olá, ${firstName(userName) || 'equipe'}`}
        description="Um resumo do catálogo: o que está no ar, o que está em destaque e o que entrou por último."
        // celular: os atalhos (com "Novo produto" em destaque) ficam na faixa logo abaixo
        actionsClassName="max-sm:hidden"
        actions={
          <Link to="/admin/produtos/novo" className={buttonVariants()}>
            <Plus aria-hidden />
            Novo produto
          </Link>
        }
      />

      <QuickActionsRail className="-mt-1 sm:hidden" />

      {stats.isError ? (
        <Panel>
          <EmptyState
            icon={<CircleAlert className="size-7" aria-hidden />}
            title="Não foi possível carregar o painel"
            description={errorMessage(stats.error)}
            action={
              <Button variant="outline" size="sm" loading={stats.isFetching} onClick={() => void stats.refetch()}>
                Tentar novamente
              </Button>
            }
          />
        </Panel>
      ) : (
        <>
          <section aria-labelledby="painel-resumo">
            <h2 id="painel-resumo" className="sr-only">
              Resumo do catálogo
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-busy={loading || undefined}>
              {loading || !data ? (
                <>
                  <TotalProductsCardSkeleton className="col-span-2 xl:row-span-2" />
                  {Array.from({ length: 4 }, (_, i) => (
                    <StatCardSkeleton key={i} />
                  ))}
                </>
              ) : (
                <>
                  <TotalProductsCard
                    className="col-span-2 xl:row-span-2"
                    total={data.totalProducts}
                    active={data.activeProducts}
                    inactive={data.inactiveProducts}
                  />
                  <StatCard
                    index={1}
                    to="/admin/categorias"
                    icon={Tags}
                    label="Categorias"
                    value={data.totalCategories}
                    caption={`${formatCount(usedCategories)} com produtos`}
                  />
                  <StatCard
                    index={2}
                    to="/admin/distribuidores"
                    icon={Truck}
                    label="Distribuidores"
                    value={data.totalDistributors}
                    caption={`${formatCount(usedDistributors)} com produtos`}
                    tone="neutral"
                  />
                  <StatCard
                    index={3}
                    to="/admin/produtos?destaque=1&status=ativos"
                    icon={Star}
                    label="Em destaque"
                    value={data.featuredProducts}
                    caption={featuredCaption(data.featuredProducts)}
                    tone="amber"
                  />
                  <StatCard
                    index={4}
                    to="/admin/produtos?promo=1"
                    icon={BadgePercent}
                    label="Desconto à vista"
                    value={data.onSaleProducts}
                    caption={`${formatShare(data.onSaleProducts, data.totalProducts)} do catálogo`}
                    tone="emerald"
                  />
                </>
              )}
            </div>
          </section>

          {/* celular: rankings depois dos cadastros recentes (o que o lojista mais consulta vem antes) */}
          <div className="grid gap-4 max-md:order-last sm:gap-6 lg:grid-cols-2">
            <BarListPanel
              title="Produtos por categoria"
              items={data?.productsByCategory}
              total={data?.totalProducts ?? 0}
              loading={loading}
              manageHref="/admin/categorias"
              limit={barLimit}
              noun={CATEGORY_NOUN}
              itemHref={categoryProductsHref}
            />
            <BarListPanel
              title="Produtos por distribuidor"
              items={data?.productsByDistributor}
              total={data?.totalProducts ?? 0}
              loading={loading}
              manageHref="/admin/distribuidores"
              limit={barLimit}
              noun={DISTRIBUTOR_NOUN}
              itemHref={distributorProductsHref}
            />
          </div>

          <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <RecentProductsPanel products={data?.recentProducts} loading={loading} categoryName={categoryName} />
            <QuickActionsPanel className="max-sm:hidden" />
          </div>
        </>
      )}
    </div>
  )
}
