/**
 * Hero Carousel da Home — slide de marca + um slide por produto em destaque.
 *
 * - Autoplay de 6,5 s que pausa em hover (mouse), foco por teclado, aba oculta,
 *   hero fora da tela, Visualização Rápida aberta, arraste e "reduzir movimento".
 * - Navegação por setas, pílulas (com progresso), swipe/arraste e ←/→.
 * - Altura estável: no desktop é fixa; no celular/tablet slides "fantasma"
 *   invisíveis reservam a altura do maior slide (sem saltos no autoplay).
 */
import { AnimatePresence, m, useInView, useReducedMotion, type PanInfo } from 'motion/react'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useCatalogLookups, useFeaturedProducts } from '@/hooks/catalog'
import { useQuickView } from '@/hooks/use-quick-view'
import { preloadImage } from '@/lib/images'
import { HeroControls } from './hero-controls'
import {
  BRAND_SLIDE,
  HERO_ART_SIZES,
  HERO_FEATURED_LIMIT,
  SWIPE_OFFSET,
  SWIPE_VELOCITY,
  isFocusVisible,
  type HeroSlide,
} from './hero-shared'
import { BrandSlide, HeroBackdrop, HeroSlideFrame, ProductSlide } from './hero-slides'
import { useDocumentVisible } from './use-document-visible'

/** Slide ativo guardado pela chave: se a lista mudar (destaque novo/removido), o mesmo produto continua na tela. */
interface NavState {
  key: string
  /** posição quando foi escolhido — reserva caso o slide saia da lista */
  index: number
  direction: 1 | -1
}

function resolveIndex(slides: readonly HeroSlide[], nav: NavState): number {
  const found = slides.findIndex((slide) => slide.key === nav.key)
  return found >= 0 ? found : Math.min(nav.index, slides.length - 1)
}

export function HeroCarousel() {
  const featured = useFeaturedProducts(HERO_FEATURED_LIMIT)
  const { distributorName, categoryName } = useCatalogLookups()
  const { open: openQuickView, isOpen: quickViewOpen } = useQuickView()
  const reduceMotion = useReducedMotion() ?? false
  const pageVisible = useDocumentVisible()

  const panelRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragMovedRef = useRef(false)
  const inView = useInView(panelRef, { amount: 0.3 })
  const viewportId = useId()

  const products = featured.data
  const slides = useMemo<HeroSlide[]>(
    () => [BRAND_SLIDE, ...(products ?? []).map((product) => ({ kind: 'product' as const, key: product.id, product }))],
    [products],
  )
  const stack = useMemo(() => (products ?? []).slice(0, 3), [products])
  const count = slides.length

  const [nav, setNav] = useState<NavState>({ key: BRAND_SLIDE.key, index: 0, direction: 1 })
  const active = resolveIndex(slides, nav)
  const current = slides[active]

  const [userPaused, setUserPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const [dragging, setDragging] = useState(false)

  const canAutoplay = count > 1 && !reduceMotion
  const playing =
    canAutoplay && !userPaused && !hovered && !keyboardFocus && !dragging && pageVisible && inView && !quickViewOpen

  const paginate = useCallback(
    (delta: 1 | -1) => {
      setNav((prev) => {
        const target = (resolveIndex(slides, prev) + delta + count) % count
        return { key: slides[target].key, index: target, direction: delta }
      })
    },
    [slides, count],
  )

  const goTo = useCallback(
    (target: number) => {
      setNav((prev) => {
        const from = resolveIndex(slides, prev)
        if (target === from || !slides[target]) return prev
        return { key: slides[target].key, index: target, direction: target > from ? 1 : -1 }
      })
    },
    [slides],
  )

  const next = useCallback(() => paginate(1), [paginate])
  const prev = useCallback(() => paginate(-1), [paginate])
  const togglePause = useCallback(() => setUserPaused((paused) => !paused), [])

  // pré-carrega a arte do próximo slide quando o navegador estiver ocioso
  const upcoming = count > 1 ? slides[(active + 1) % count] : undefined
  const upcomingImage = upcoming?.kind === 'product' ? upcoming.product.images[0] : undefined
  useEffect(() => {
    if (!upcomingImage) return
    const run = () => preloadImage(upcomingImage, HERO_ART_SIZES)
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(run, { timeout: 2500 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(run, 800)
    return () => window.clearTimeout(id)
  }, [upcomingImage])

  // ---------------------------------------------------------------- eventos

  function handlePointerEnter(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse') setHovered(true)
  }

  function handlePointerLeave(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse') setHovered(false)
  }

  function handleFocus(event: ReactFocusEvent<HTMLDivElement>) {
    setKeyboardFocus(isFocusVisible(event.target))
  }

  function handleBlur(event: ReactFocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocus(false)
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (count < 2 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const target = event.target as HTMLElement
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return
    event.preventDefault()
    // o slide com foco vai sair da tela: mantém o foco dentro do carrossel
    if (target.closest('[data-hero-slide]')) viewportRef.current?.focus({ preventScroll: true })
    paginate(event.key === 'ArrowRight' ? 1 : -1)
  }

  function handleDragStart() {
    dragMovedRef.current = true
    setDragging(true)
  }

  function handleDragEnd(_event: unknown, info: PanInfo) {
    setDragging(false)
    const { offset, velocity } = info
    if (offset.x < -SWIPE_OFFSET || (velocity.x < -SWIPE_VELOCITY && offset.x < -12)) paginate(1)
    else if (offset.x > SWIPE_OFFSET || (velocity.x > SWIPE_VELOCITY && offset.x > 12)) paginate(-1)
    // o "click" que encerra o arraste não deve acionar links/botões do slide
    window.setTimeout(() => {
      dragMovedRef.current = false
    }, 0)
  }

  function handleClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    if (!dragMovedRef.current) return
    event.preventDefault()
    event.stopPropagation()
  }

  // ---------------------------------------------------------------- render

  const renderSlide = (slide: HeroSlide, ghost: boolean) =>
    slide.kind === 'brand' ? (
      <BrandSlide
        products={stack}
        loading={featured.isPending}
        dir={nav.direction}
        ghost={ghost}
        onOpen={openQuickView}
      />
    ) : (
      <ProductSlide
        product={slide.product}
        distributorName={distributorName(slide.product.distributor)}
        categoryName={categoryName(slide.product.category)}
        dir={nav.direction}
        ghost={ghost}
        onOpen={openQuickView}
      />
    )

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Destaques"
      className="container-page pt-3 sm:pt-5"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={panelRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="relative isolate flex flex-col overflow-hidden rounded-[1.75rem] bg-ink-950 text-white shadow-[0_40px_100px_-50px_rgb(13_13_13/0.65)] ring-1 ring-black/5 sm:rounded-[2rem] lg:h-[min(78svh,680px)] lg:min-h-[34rem] dark:ring-white/[0.07]"
      >
        {/* camadas de fundo */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <AnimatePresence initial={false}>
            <HeroBackdrop key={current.key} slide={current} />
          </AnimatePresence>
          <div className="absolute inset-0 [background-image:linear-gradient(rgb(255_255_255/0.045)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.045)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_65%_60%_at_70%_40%,#000,transparent)]" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-linear-to-t from-ink-950/90 to-transparent" />
        </div>

        <m.div
          id={viewportId}
          ref={viewportRef}
          tabIndex={-1}
          aria-live={playing ? 'off' : 'polite'}
          drag={count > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.14}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onClickCapture={handleClickCapture}
          className="relative grid min-h-0 flex-1 grid-cols-1 rounded-[1.75rem] outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white/40 sm:rounded-[2rem] lg:grid-rows-[minmax(0,1fr)]"
        >
          {/* reservam a altura do maior slide (somente abaixo de lg, onde a altura é automática) */}
          {slides.map((slide) => (
            <div key={`ghost-${slide.key}`} aria-hidden inert className="invisible col-start-1 row-start-1 lg:hidden">
              {renderSlide(slide, true)}
            </div>
          ))}

          <AnimatePresence initial={false} custom={nav.direction}>
            <HeroSlideFrame key={current.key} label={`${active + 1} de ${count}`} dir={nav.direction}>
              {renderSlide(current, false)}
            </HeroSlideFrame>
          </AnimatePresence>
        </m.div>

        {count > 1 ? (
          <HeroControls
            slides={slides}
            active={active}
            canAutoplay={canAutoplay}
            playing={playing}
            userPaused={userPaused}
            controlsId={viewportId}
            onSelect={goTo}
            onPrev={prev}
            onNext={next}
            onTogglePause={togglePause}
            onAutoplayComplete={next}
          />
        ) : (
          <div aria-hidden className="h-8 sm:h-12" />
        )}
      </div>
    </section>
  )
}
