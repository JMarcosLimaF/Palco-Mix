/**
 * Faixa escura de largura total com as marcas rolando infinitamente (CSS puro:
 * lista duplicada + translateX). Pausa no hover/foco, pelo botão (toque — WCAG 2.2.2),
 * fora da tela e com a aba oculta; estática e sem cópias com "reduzir movimento".
 * Só a 1ª ocorrência de cada marca é acessível.
 */
import { Pause, Play } from 'lucide-react'
import { useInView } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { LogoMark } from '@/components/brand/logo'
import { useDistributors } from '@/hooks/catalog'
import { catalogHref } from '@/lib/catalog-params'
import { cn, pluralize } from '@/lib/utils'
import { nameCollator, useActiveCatalogIndex } from './catalog-index'
import { SectionHeader } from './section-header'
import { useDocumentVisible } from './use-document-visible'

const KEYFRAMES = '@keyframes palco-marquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}'
/** nomes por metade da faixa (garante que ela cubra telas largas) */
const MIN_PER_HALF = 8
const SECONDS_PER_ITEM = 3.4
const HINT = 'Toque em uma marca para ver tudo dela no catálogo.'

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
          : 'motion-reduce:w-full motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center-safe motion-reduce:gap-y-6',
      )}
    >
      {entries.map(({ brand, rep, position }) => {
        const copy = duplicate || rep > 0
        const outlined = position % 2 === 1
        return (
          <li
            key={`${rep}-${brand.id}`}
            aria-hidden={!duplicate && copy ? true : undefined}
            className={cn(
              'flex shrink-0 items-center motion-reduce:max-w-full motion-reduce:shrink',
              !duplicate && copy && 'motion-reduce:hidden',
            )}
          >
            <Link
              to={catalogHref({ distributors: [brand.id] })}
              tabIndex={copy ? -1 : undefined}
              className={cn(
                // celular: faixa baixa (2–3 nomes por vez); alvo de toque ≥ 44px de altura
                'title-display flex min-h-11 items-start gap-1 rounded-lg px-3.5 py-2 text-[1.75rem] leading-none whitespace-nowrap transition-colors duration-300',
                'sm:gap-1.5 sm:px-8 sm:text-7xl lg:text-8xl',
                // estática (reduzir movimento): nomes longos quebram linha em vez de vazar da tela
                'motion-reduce:min-w-0 motion-reduce:text-[1.75rem] motion-reduce:break-words motion-reduce:whitespace-normal sm:motion-reduce:text-4xl',
                outlined
                  ? 'text-transparent [-webkit-text-stroke:1.5px_rgb(255_255_255/0.55)] hover:text-white hover:[-webkit-text-stroke-color:transparent]'
                  : 'text-white hover:text-brand-400',
                outlined && 'max-sm:[-webkit-text-stroke-width:1px]',
              )}
            >
              {brand.name}
              <sup aria-hidden className="mt-0.5 font-sans text-[0.6875rem] font-semibold tracking-normal text-white/45 not-italic tabular-nums [-webkit-text-stroke:0] sm:mt-1 sm:text-sm">
                {brand.count}
              </sup>
              <span className="sr-only"> ({pluralize(brand.count, 'produto', 'produtos')})</span>
            </Link>
            <LogoMark className="h-3.5 shrink-0 text-white/20 sm:h-8" />
          </li>
        )
      })}
    </ul>
  )
}

export function BrandMarquee() {
  const distributors = useDistributors()
  const catalog = useActiveCatalogIndex()
  const stripRef = useRef<HTMLDivElement>(null)
  const inView = useInView(stripRef)
  const pageVisible = useDocumentVisible()
  const [userPaused, setUserPaused] = useState(false)
  const running = !userPaused && inView && pageVisible

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
      className="relative mt-10 overflow-hidden bg-ink-950 py-8 text-white sm:mt-24 sm:py-20"
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
          description={HINT}
          action={{ to: '/distribuidores', label: 'Ver todas', ariaLabel: 'Ver todas as marcas' }}
        />
      </div>

      {/* foco por teclado: a faixa para e volta ao início, e o próprio contêiner rola até o link focado */}
      <div
        ref={stripRef}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.scrollLeft = 0
        }}
        className="group/marquee relative mt-3 scroll-px-[12%] overflow-hidden py-1 sm:mt-14 sm:py-0 [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] sm:[mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)] motion-reduce:[mask-image:none]"
      >
        <div
          className={cn(
            'flex w-max animate-[palco-marquee_40s_linear_infinite] group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:animate-none motion-reduce:w-full motion-reduce:animate-none',
            !running && '[animation-play-state:paused]',
          )}
          style={{ animationDuration: `${half.length * SECONDS_PER_ITEM}s` }}
        >
          <MarqueeList entries={half} />
          <MarqueeList entries={half} duplicate />
        </div>
      </div>

      {/* sem "reduzir movimento" a faixa não para sozinha: no toque, este é o jeito de pausar.
          No celular a dica (descrição do cabeçalho, oculta lá) fica ao lado do botão. */}
      <div className="container-page relative mt-3 flex items-center justify-between gap-4 sm:mt-8 sm:justify-end sm:motion-reduce:hidden">
        <p className="text-xs text-white/55 sm:hidden">{HINT}</p>
        <button
          type="button"
          onClick={() => setUserPaused((paused) => !paused)}
          aria-pressed={userPaused}
          aria-label="Pausar faixa de marcas"
          title={userPaused ? 'Retomar faixa de marcas' : 'Pausar faixa de marcas'}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-colors duration-300 ease-out-expo hover:bg-white/20 focus-visible:outline-white motion-reduce:hidden"
        >
          {userPaused ? <Play aria-hidden className="size-4 translate-x-px" /> : <Pause aria-hidden className="size-4" />}
        </button>
      </div>
    </section>
  )
}
