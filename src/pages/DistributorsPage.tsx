import { RotateCw, Search, SearchX, Store, X } from 'lucide-react'
import { useDeferredValue, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { NO_PRODUCTS, nameCollator, useActiveCatalogIndex } from '@/components/home/catalog-index'
import { DistributorCard, DistributorCardSkeleton } from '@/components/home/distributor-card'
import { PageHero } from '@/components/home/page-hero'
import { Reveal } from '@/components/home/reveal'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { EmptyState } from '@/components/ui/feedback'
import { Input } from '@/components/ui/form'
import { useDistributors } from '@/hooks/catalog'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { normalizeText, pluralize } from '@/lib/utils'

// celular: 2 colunas de cards compactos (15 marcas em ~3 telas); sm+: cards completos em 2/3 colunas
const GRID = 'grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-3'

/**
 * No celular, ao focar a busca, leva o campo para o topo da tela: o teclado virtual
 * ocupa metade da altura e, sem isso, a lista filtrada ficaria escondida atrás dele.
 */
function bringSearchIntoView(input: HTMLInputElement) {
  if (!window.matchMedia('(max-width: 639px) and (pointer: coarse)').matches) return
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // espera o teclado começar a abrir (o viewport visual encolhe) antes de rolar
  window.setTimeout(() => input.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' }), 150)
}

export default function DistributorsPage() {
  useDocumentTitle('Distribuidores')
  const distributors = useDistributors()
  const catalog = useActiveCatalogIndex()
  const loading = distributors.isPending || catalog.isLoading
  const inputRef = useRef<HTMLInputElement>(null)
  const [term, setTerm] = useState('')
  const deferredTerm = useDeferredValue(term)

  // mais produtos ativos primeiro; empate em ordem alfabética
  const all = useMemo(
    () =>
      (distributors.data ?? [])
        .map((distributor) => {
          const products = catalog.byDistributor.get(distributor.id) ?? NO_PRODUCTS
          return {
            distributor,
            count: products.length,
            preview: products.slice(0, 3),
            haystack: normalizeText(distributor.name),
          }
        })
        .sort((a, b) => b.count - a.count || nameCollator.compare(a.distributor.name, b.distributor.name)),
    [distributors.data, catalog.byDistributor],
  )

  const needle = normalizeText(deferredTerm)
  const visible = useMemo(() => (needle ? all.filter((item) => item.haystack.includes(needle)) : all), [all, needle])

  function clearSearch() {
    setTerm('')
    inputRef.current?.focus()
  }

  const status = loading
    ? ''
    : needle
      ? `${pluralize(visible.length, 'marca encontrada', 'marcas encontradas')} de ${all.length}`
      : pluralize(all.length, 'marca', 'marcas')

  return (
    <>
      <PageHero
        crumb="Distribuidores"
        eyebrow="Distribuidores"
        title="Marcas em cartaz"
        description="Conheça as marcas do catálogo da Palco Mix e veja os produtos de cada uma."
        stats={[
          { label: 'Marcas', value: loading ? undefined : all.length },
          { label: 'Produtos', value: loading ? undefined : catalog.total },
        ]}
      />

      <section aria-label="Lista de marcas" className="container-page pt-5 pb-8 sm:py-12">
        <div className="mb-5 flex flex-col gap-2.5 sm:mb-10 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="relative w-full sm:max-w-sm">
            <label htmlFor="busca-marca" className="sr-only">
              Buscar marca pelo nome
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-4 size-[1.1rem] -translate-y-1/2 text-subtle"
            />
            <Input
              ref={inputRef}
              id="busca-marca"
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              onFocus={(event) => bringSearchIntoView(event.currentTarget)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && term) {
                  event.preventDefault()
                  setTerm('')
                }
              }}
              placeholder="Buscar marca…"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              disabled={loading}
              className="h-12 rounded-full pr-12 pl-11 text-base sm:text-sm"
            />
            {term && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Limpar busca"
                className="absolute top-1/2 right-1 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-subtle transition-colors hover:bg-surface-2 hover:text-fg sm:right-2 sm:size-9"
              >
                <X aria-hidden className="size-4" />
              </button>
            )}
          </div>
          <p role="status" aria-live="polite" className="text-sm text-muted tabular-nums">
            {status}
          </p>
        </div>

        {loading ? (
          <div className={GRID} role="status" aria-label="Carregando marcas">
            {Array.from({ length: 6 }, (_, i) => (
              <DistributorCardSkeleton key={i} />
            ))}
          </div>
        ) : distributors.isError ? (
          <EmptyState
            title="Não foi possível carregar as marcas"
            description="Tente novamente em instantes."
            action={
              <Button variant="outline" onClick={() => void distributors.refetch()}>
                <RotateCw aria-hidden />
                Tentar de novo
              </Button>
            }
          />
        ) : all.length === 0 ? (
          <EmptyState
            icon={<Store className="size-7" aria-hidden />}
            title="Nenhuma marca cadastrada ainda"
            description="Enquanto isso, dá uma olhada no catálogo completo."
            action={
              <Link to="/catalogo" className={buttonVariants({ variant: 'primary' })}>
                Ver catálogo
              </Link>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-7" aria-hidden />}
            title="Nenhuma marca encontrada"
            description={`Não achamos marcas com “${deferredTerm.trim()}”. Confira a grafia ou tente outro nome.`}
            action={
              <Button variant="outline" onClick={clearSearch}>
                Limpar busca
              </Button>
            }
          />
        ) : (
          <ul className={GRID}>
            {visible.map((item, i) => (
              <li key={item.distributor.id}>
                <Reveal className="h-full" delay={(i % 2) * 0.06}>
                  <DistributorCard
                    distributor={item.distributor}
                    count={item.count}
                    preview={item.preview}
                    priority={i < 2}
                  />
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
