/**
 * Faixa escura de largura total com as marcas rolando infinitamente (CSS puro:
 * lista duplicada + translateX). Pausa no hover/foco; estática e sem cópias
 * com "reduzir movimento". Só a 1ª ocorrência de cada marca é acessível.
 */
import { useMemo } from 'react'
import { Link } from 'react-router'
import { LogoMark } from '@/components/brand/logo'
import { useDistributors } from '@/hooks/catalog'
import { catalogHref } from '@/lib/catalog-params'
import { cn, pluralize } from '@/lib/utils'
import { nameCollator, useActiveCatalogIndex } from './catalog-index'
import { SectionHeader } from './section-header'

const KEYFRAMES = '@keyframes palco-marquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}'
/** nomes por metade da faixa (garante que ela cubra telas largas) */
const MIN_PER_HALF = 8
const SECONDS_PER_ITEM = 3.4

interface MarqueeBrand {
  id: string
  name: string
  count: number
}

interface MarqueeEntry {
  brand: MarqueeBrand
  /** repetição dentro da metade (0 = original) */
  rep: number
  /** posição global (alterna preenchido/contorno) */
  position: number
}

function MarqueeList({ entries, duplicate = false }: { entries: MarqueeEntry[]; duplicate?: boolean }) {
  return (
    <ul
      aria-hidden={duplicate || undefined}
      className={cn(
        'flex shrink-0 items-center',
        duplicate
          ? 'motion-reduce:hidden'
          : 'motion-reduce:w-full motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-6',
      )}
    >
      {entries.map(({ brand, rep, position }) => {
        const copy = duplicate || rep > 0
        const outlined = position % 2 === 1
        return (
          <li
            key={`${rep}-${brand.id}`}
            aria-hidden={!duplicate && copy ? true : undefined}
            className={cn('flex shrink-0 items-center', !duplicate && copy && 'motion-reduce:hidden')}
          >
            <Link
              to={catalogHref({ distributors: [brand.id] })}
              tabIndex={copy ? -1 : undefined}
              className={cn(
                'title-display flex items-start gap-1.5 rounded-lg px-5 py-2 text-5xl leading-none whitespace-nowrap transition-colors duration-300 sm:px-8 sm:text-7xl lg:text-8xl',
                outlined
                  ? 'text-transparent [-webkit-text-stroke:1.5px_rgb(255_255_255/0.55)] hover:text-white hover:[-webkit-text-stroke-color:transparent]'
                  : 'text-white hover:text-brand-400',
              )}
            >
              {brand.name}
              <sup aria-hidden className="mt-1 font-sans text-xs font-semibold tracking-normal text-white/45 not-italic tabular-nums [-webkit-text-stroke:0] sm:text-sm">
                {brand.count}
              </sup>
              <span className="sr-only"> ({pluralize(brand.count, 'produto', 'produtos')})</span>
            </Link>
            <LogoMark className="h-5 shrink-0 text-white/20 sm:h-8" />
          </li>
        )
      })}
    </ul>
  )
}

export function BrandMarquee() {
  const distributors = useDistributors()
  const catalog = useActiveCatalogIndex()

  const brands = useMemo<MarqueeBrand[]>(
    () =>
      (distributors.data ?? [])
        .map((d) => ({ id: d.id, name: d.name, count: catalog.byDistributor.get(d.id)?.length ?? 0 }))
        .filter((b) => b.count > 0)
        .sort((a, b) => b.count - a.count || nameCollator.compare(a.name, b.name)),
    [distributors.data, catalog.byDistributor],
  )

  const half = useMemo<MarqueeEntry[]>(() => {
    if (brands.length === 0) return []
    let reps = Math.max(1, Math.ceil(MIN_PER_HALF / brands.length))
    // metade com tamanho par mantém a alternância contorno/preenchido na emenda
    if ((brands.length * reps) % 2 === 1) reps += 1
    return Array.from({ length: reps }, (_, rep) =>
      brands.map((brand, i) => ({ brand, rep, position: rep * brands.length + i })),
    ).flat()
  }, [brands])

  if (half.length === 0) return null

  return (
    <section
      aria-labelledby="home-marcas"
      className="relative mt-16 overflow-hidden bg-ink-950 py-14 text-white sm:mt-24 sm:py-20"
    >
      <style href="palco-home-marquee" precedence="default">
        {KEYFRAMES}
      </style>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_90%_at_50%_120%,rgb(0_102_255/0.3),transparent_70%)]"
      />

      <div className="container-page relative">
        <SectionHeader
          id="home-marcas"
          tone="inverted"
          eyebrow="Marcas"
          title="Marcas em cartaz"
          description="Toque em uma marca para ver tudo dela no catálogo."
          action={{ to: '/distribuidores', label: 'Ver todas', ariaLabel: 'Ver todas as marcas' }}
        />
      </div>

      {/* foco por teclado: a faixa para e volta ao início, e o próprio contêiner rola até o link focado */}
      <div
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.scrollLeft = 0
        }}
        className="group/marquee relative mt-10 scroll-px-[12%] overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)] sm:mt-14 motion-reduce:[mask-image:none]"
      >
        <div
          className="flex w-max animate-[palco-marquee_40s_linear_infinite] group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:animate-none motion-reduce:w-full motion-reduce:animate-none"
          style={{ animationDuration: `${half.length * SECONDS_PER_ITEM}s` }}
        >
          <MarqueeList entries={half} />
          <MarqueeList entries={half} duplicate />
        </div>
      </div>
    </section>
  )
}
