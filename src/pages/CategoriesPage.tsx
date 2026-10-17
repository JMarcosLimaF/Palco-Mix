import { RotateCw, Tags } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { nameCollator, useActiveCatalogIndex } from '@/components/home/catalog-index'
import { CategoryCard, CategoryCardSkeleton } from '@/components/home/category-card'
import { PageHero } from '@/components/home/page-hero'
import { Reveal } from '@/components/home/reveal'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { EmptyState } from '@/components/ui/feedback'
import { useCategories } from '@/hooks/catalog'
import { useDocumentTitle } from '@/hooks/use-document-title'

// celular: lista de cards horizontais compactos; sm+: grade 2/3 colunas
const GRID = 'grid gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3'

export default function CategoriesPage() {
  useDocumentTitle('Categorias')
  const categories = useCategories()
  const catalog = useActiveCatalogIndex()
  const loading = categories.isPending || catalog.isLoading

  // as que têm mais produtos primeiro; empate em ordem alfabética
  const items = useMemo(
    () =>
      (categories.data ?? [])
        .map((category) => {
          const products = catalog.byCategory.get(category.id) ?? []
          return { category, count: products.length, cover: category.image ?? products[0]?.images[0] }
        })
        .sort((a, b) => b.count - a.count || nameCollator.compare(a.category.name, b.category.name)),
    [categories.data, catalog.byCategory],
  )

  return (
    <>
      <PageHero
        crumb="Categorias"
        eyebrow="Categorias"
        title="Compre por categoria"
        description="Escolha uma seção e veja todos os produtos dela no catálogo."
        stats={[
          { label: 'Categorias', value: loading ? undefined : items.length },
          { label: 'Produtos', value: loading ? undefined : catalog.total },
        ]}
      />

      <section aria-label="Lista de categorias" className="container-page py-6 sm:py-14">
        {loading ? (
          <div className={GRID} role="status" aria-label="Carregando categorias">
            {Array.from({ length: 6 }, (_, i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        ) : categories.isError ? (
          <EmptyState
            title="Não foi possível carregar as categorias"
            description="Tente novamente em instantes."
            action={
              <Button variant="outline" onClick={() => void categories.refetch()}>
                <RotateCw aria-hidden />
                Tentar de novo
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Tags className="size-7" aria-hidden />}
            title="Nenhuma categoria por aqui ainda"
            description="Enquanto isso, dá uma olhada no catálogo completo."
            action={
              <Link to="/catalogo" className={buttonVariants({ variant: 'primary' })}>
                Ver catálogo
              </Link>
            }
          />
        ) : (
          <ul className={GRID}>
            {items.map((item, i) => (
              <li key={item.category.id}>
                <Reveal className="h-full" delay={(i % 3) * 0.06}>
                  <CategoryCard category={item.category} count={item.count} cover={item.cover} priority={i < 3} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
