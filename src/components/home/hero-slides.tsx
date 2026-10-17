/**
 * Slides do HeroCarousel.
 * `ghost` renderiza só o esqueleto do layout (sem imagens nem interação): é usado,
 * invisível, para reservar a altura do maior slide no celular/tablet e evitar
 * saltos de layout durante o autoplay.
 */
import { ArrowRight, Eye, Ruler } from 'lucide-react'
import {
  m,
  useIsPresent,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { Link } from 'react-router'
import { LogoBadge, LogoMark } from '@/components/brand/logo'
import { WhatsAppIcon } from '@/components/brand/social-icons'
import { Price } from '@/components/catalog/price'
import { ProductImage } from '@/components/catalog/product-image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { site, whatsappLink } from '@/config/site'
import { useMediaQuery } from '@/hooks/use-media-query'
import { catalogHref } from '@/lib/catalog-params'
import { cn, isNewProduct } from '@/lib/utils'
import type { Product } from '@/types/catalog'
import {
  FLOAT_ANIMATION,
  FLOAT_TRANSITION,
  HERO_ART_SIZES,
  HERO_PRICE_CLASS,
  HERO_STACK_SIZES,
  HERO_WHATSAPP_MESSAGE,
  INVERTED_OUTLINE,
  heroArtVariants,
  heroBackdropVariants,
  heroItemVariants,
  heroSlideVariants,
  heroStackVariants,
  type HeroSlide,
} from './hero-shared'

/** Versão curta da descrição da loja para o hero no celular. */
const BRAND_SHORT_DESCRIPTION = 'As marcas que você ama, com pedido direto pelo WhatsApp.'

/**
 * Linha de CTAs: lado a lado também no celular (principal largo + secundário compacto).
 * Em telas < 360px não cabem os dois: o secundário desce e ocupa a linha inteira.
 */
const HERO_CTA_ROW = 'mt-4 flex flex-wrap gap-2.5 sm:mt-8 sm:gap-3'
const HERO_CTA_SECONDARY = 'max-[359px]:flex-1'
/** Botões um pouco mais baixos no celular; tamanho "lg" normal a partir de sm. */
const HERO_CTA_MOBILE = 'h-12 px-4 text-sm sm:h-13 sm:flex-none sm:px-7 sm:text-base'

// ------------------------------------------------------------------ moldura

export interface HeroSlideFrameProps {
  label: string
  dir: number
  children: ReactNode
}

/** Slide acessível (role=group) com crossfade; fica inerte enquanto sai de cena. */
export function HeroSlideFrame({ label, dir, children }: HeroSlideFrameProps) {
  const isPresent = useIsPresent()
  return (
    <m.div
      role="group"
      aria-roledescription="slide"
      aria-label={label}
      data-hero-slide=""
      inert={!isPresent}
      custom={dir}
      variants={heroSlideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className={cn('relative col-start-1 row-start-1 min-w-0', isPresent ? 'z-10' : 'pointer-events-none z-0')}
    >
      {children}
    </m.div>
  )
}

// ------------------------------------------------------------------ fundos

/** Fundo do slide: arte desfocada + brilho azul (produto) ou "holofote" de palco (marca). */
export function HeroBackdrop({ slide }: { slide: HeroSlide }) {
  return (
    <m.div variants={heroBackdropVariants} initial="enter" animate="center" exit="exit" className="absolute inset-0">
      {slide.kind === 'product' ? (
        <>
          <ProductImage
            path={slide.product.images[0]}
            alt=""
            fit="cover"
            sizes={HERO_ART_SIZES}
            className="scale-125 transform-gpu opacity-35 blur-3xl"
          />
          <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_22%,rgb(0_102_255/0.32),transparent_70%)] md:bg-[radial-gradient(45%_65%_at_76%_45%,rgb(0_102_255/0.3),transparent_70%)]" />
          <div className="absolute inset-0 bg-linear-to-t from-ink-950 via-ink-950/70 to-ink-950/20 md:bg-linear-to-r md:from-ink-950 md:via-ink-950/75 md:to-ink-950/10" />
        </>
      ) : (
        <>
          {/* holofote vindo de cima + "piso" iluminado do palco */}
          <div className="absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_-5%,rgb(77_148_255/0.3),transparent_70%)] md:bg-[radial-gradient(42%_70%_at_74%_-8%,rgb(77_148_255/0.3),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_14%_at_50%_44%,rgb(0_102_255/0.32),transparent_70%)] md:bg-[radial-gradient(34%_16%_at_74%_86%,rgb(0_102_255/0.34),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(50%_60%_at_0%_100%,rgb(0_82_204/0.22),transparent_70%)]" />
          <LogoMark className="absolute -right-[10%] -bottom-[14%] h-[90%] w-auto text-white opacity-[0.045]" />
        </>
      )}
    </m.div>
  )
}

// ------------------------------------------------------------------ slide de marca

const PARALLAX_SPRING = { stiffness: 140, damping: 22, mass: 0.6 }

// posição, rotação e profundidade (px de parallax) de cada cartão da composição
const STACK_LAYOUT = [
  { className: 'left-[26%] top-[13%] z-20 w-[48%]', rotate: -3, depth: 28 },
  { className: 'left-[2%] top-[29%] z-10 w-[41%]', rotate: -11, depth: 14 },
  { className: 'right-[2%] top-[5%] z-10 w-[41%]', rotate: 9, depth: 20 },
] as const

interface ParallaxLayerProps {
  sx: MotionValue<number>
  sy: MotionValue<number>
  depth: number
  className: string
  children: ReactNode
}

function ParallaxLayer({ sx, sy, depth, className, children }: ParallaxLayerProps) {
  const x = useTransform(sx, (v) => v * depth)
  const y = useTransform(sy, (v) => v * depth * 0.6)
  return (
    <m.div style={{ x, y }} className={cn('absolute', className)}>
      {children}
    </m.div>
  )
}

interface HeroStackProps {
  products: readonly Product[]
  loading: boolean
  sx: MotionValue<number>
  sy: MotionValue<number>
  onOpen: (id: string) => void
}

/** Composição de até 3 artes sobrepostas + selo oficial, com parallax no mouse. */
function HeroStack({ products, loading, sx, sy, onOpen }: HeroStackProps) {
  if (loading) {
    return (
      <>
        {STACK_LAYOUT.map((slot) => (
          <div key={slot.className} aria-hidden className={cn('absolute', slot.className)}>
            <div
              className="aspect-[5/6] w-full animate-pulse rounded-2xl bg-white/[0.06] ring-1 ring-white/10"
              style={{ rotate: `${slot.rotate}deg` }}
            />
          </div>
        ))}
      </>
    )
  }

  if (products.length === 0) {
    return (
      <m.div variants={heroStackVariants} aria-hidden className="absolute inset-0 flex items-center justify-center">
        <div className="absolute size-[55%] rounded-full bg-brand-500/30 blur-3xl" />
        <LogoBadge size={320} className="relative h-auto w-[58%]" />
      </m.div>
    )
  }

  return (
    <>
      <div aria-hidden className="absolute inset-x-[8%] bottom-[0%] h-[14%] rounded-[50%] bg-brand-500/35 blur-2xl" />
      {products.slice(0, STACK_LAYOUT.length).map((product, i) => {
        const slot = STACK_LAYOUT[i]
        return (
          <ParallaxLayer key={product.id} sx={sx} sy={sy} depth={slot.depth} className={slot.className}>
            <m.div variants={heroStackVariants}>
              <button
                type="button"
                onClick={() => onOpen(product.id)}
                aria-label={`Ver detalhes: ${product.name}`}
                style={{ rotate: `${slot.rotate}deg` }}
                className={cn(
                  'group/card relative block aspect-[5/6] w-full cursor-pointer overflow-hidden rounded-2xl bg-ink-900',
                  'shadow-[0_40px_80px_-30px_rgb(0_0_0/0.95)] ring-1 ring-white/10',
                  'transition-[translate,box-shadow] duration-500 ease-out-expo hover:-translate-y-2 hover:ring-white/30',
                  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white',
                )}
              >
                <ProductImage
                  path={product.images[0]}
                  alt=""
                  sizes={HERO_STACK_SIZES}
                  priority
                  className="transition-[opacity,scale] duration-700 ease-out-expo group-hover/card:scale-[1.04]"
                />
              </button>
            </m.div>
          </ParallaxLayer>
        )
      })}
      <ParallaxLayer sx={sx} sy={sy} depth={38} className="top-[60%] left-[63%] z-30 w-[22%]">
        <m.div variants={heroStackVariants} aria-hidden>
          <LogoBadge size={160} className="h-auto w-full rotate-[10deg]" />
        </m.div>
      </ParallaxLayer>
    </>
  )
}

export interface BrandSlideProps {
  /** até 3 destaques para a composição */
  products: readonly Product[]
  loading: boolean
  dir: number
  ghost?: boolean
  onOpen: (id: string) => void
}

export function BrandSlide({ products, loading, dir, ghost = false, onOpen }: BrandSlideProps) {
  const reduceMotion = useReducedMotion()
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const parallax = !ghost && !reduceMotion && finePointer
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, PARALLAX_SPRING)
  const sy = useSpring(py, PARALLAX_SPRING)

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!parallax || event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    px.set((event.clientX - rect.left) / rect.width - 0.5)
    py.set((event.clientY - rect.top) / rect.height - 0.5)
  }

  function resetParallax() {
    px.set(0)
    py.set(0)
  }

  return (
    <div
      onPointerMove={parallax ? handlePointerMove : undefined}
      onPointerLeave={parallax ? resetParallax : undefined}
      className={cn(
        'grid h-full items-center gap-x-10 gap-y-4 px-5 pt-5 sm:gap-y-7 sm:px-10 sm:pt-10',
        'md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-x-14 lg:px-14 lg:pt-10',
      )}
    >
      <div className="order-2 min-w-0 md:order-1">
        {/* celulares baixos (ex.: Safari com as barras visíveis, ~660px): o rótulo sai para o hero caber */}
        <m.p
          custom={dir}
          variants={heroItemVariants}
          className="eyebrow flex items-center gap-3 text-white/70 max-sm:[@media(max-height:720px)]:hidden"
        >
          <span aria-hidden className="logo-stripe h-[3px] w-10 rounded-full" />
          {site.tagline}
        </m.p>
        <m.h2
          custom={dir}
          variants={heroItemVariants}
          className="title-display mt-3 text-[2.5rem] leading-[0.95] sm:mt-5 sm:text-6xl lg:text-7xl max-sm:[@media(max-height:720px)]:mt-0"
        >
          <span className="block">Seu estilo</span>
          <span className="block">
            sobe ao <span className="text-brand-gradient inline-block pr-[0.12em] pb-[0.06em]">palco.</span>
          </span>
        </m.h2>
        <m.p
          custom={dir}
          variants={heroItemVariants}
          className="mt-3 max-w-md text-sm leading-relaxed text-white/65 sm:mt-5 sm:text-lg"
        >
          {/* no celular, a versão curta: o hero inteiro cabe em uma tela */}
          <span className="sm:hidden">{BRAND_SHORT_DESCRIPTION}</span>
          <span className="hidden sm:inline">{site.description}</span>
        </m.p>
        <m.div custom={dir} variants={heroItemVariants} className={HERO_CTA_ROW}>
          <Link to="/catalogo" className={buttonVariants({ size: 'lg', className: cn(HERO_CTA_MOBILE, 'group/cta flex-1') })}>
            <span className="sm:hidden">Ver catálogo</span>
            <span className="hidden sm:inline">Explorar catálogo</span>
            <ArrowRight
              aria-hidden
              className="transition-transform duration-300 ease-out-expo group-hover/cta:translate-x-0.5"
            />
          </Link>
          <a
            href={whatsappLink(HERO_WHATSAPP_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              variant: 'outline',
              size: 'lg',
              className: cn(INVERTED_OUTLINE, HERO_CTA_MOBILE, HERO_CTA_SECONDARY),
            })}
          >
            <WhatsAppIcon className="text-[#25D366]" />
            <span className="sm:hidden">WhatsApp</span>
            <span className="hidden sm:inline">Pedir pelo WhatsApp</span>
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        </m.div>
      </div>

      <div className="order-1 flex items-center justify-center md:order-2 lg:h-full lg:[container-type:size]">
        {/* no celular a composição limita-se a ~24% da altura da tela (sobra espaço para título e CTAs) */}
        <div className="relative aspect-[6/5] w-[min(100%,15.5rem,calc(24svh*1.2))] sm:w-full sm:max-w-[24rem] md:max-w-[26rem] lg:w-[min(100cqw,calc(100cqh*1.2))] lg:max-w-[38rem]">
          {!ghost && <HeroStack products={products} loading={loading} sx={sx} sy={sy} onOpen={onOpen} />}
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ slide de produto

export interface ProductSlideProps {
  product: Product
  distributorName: string
  categoryName: string
  dir: number
  ghost?: boolean
  onOpen: (id: string) => void
}

export function ProductSlide({ product, distributorName, categoryName, dir, ghost = false, onOpen }: ProductSlideProps) {
  const isNew = isNewProduct(product)

  return (
    <div
      className={cn(
        'grid h-full items-center gap-x-10 gap-y-4 px-5 pt-5 sm:gap-y-7 sm:px-10 sm:pt-10',
        'md:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-x-14 lg:px-14 lg:pt-10',
      )}
    >
      <div className="order-2 min-w-0 md:order-1">
        <m.div custom={dir} variants={heroItemVariants} className="flex min-w-0 items-center gap-2.5">
          {isNew ? <Badge tone="brand">Novo</Badge> : <Badge tone="light">Destaque</Badge>}
          <p className="eyebrow min-w-0 truncate text-white/50">
            <span className="text-white/85">{distributorName}</span> · {categoryName}
          </p>
        </m.div>
        <m.h2
          custom={dir}
          variants={heroItemVariants}
          className="title-display mt-3 line-clamp-3 text-[1.625rem] text-balance sm:mt-5 sm:text-5xl xl:text-[3.5rem] max-sm:[@media(max-height:720px)]:text-2xl"
        >
          {product.name}
        </m.h2>
        {product.description && (
          <m.p
            custom={dir}
            variants={heroItemVariants}
            className="mt-4 hidden max-w-lg text-sm leading-relaxed text-white/60 sm:line-clamp-1 sm:text-base"
          >
            {product.description}
          </m.p>
        )}
        <m.div
          custom={dir}
          variants={heroItemVariants}
          className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 sm:mt-6 sm:gap-x-6 sm:gap-y-3"
        >
          <Price product={product} size="lg" showDiscount className={HERO_PRICE_CLASS} />
          {product.sizes && (
            <p className="flex items-center gap-2 text-sm text-white/55">
              <Ruler aria-hidden className="size-4 text-brand-400" />
              Numeração <span className="font-semibold text-white">{product.sizes}</span>
            </p>
          )}
        </m.div>
        <m.div custom={dir} variants={heroItemVariants} className={HERO_CTA_ROW}>
          <Button size="lg" className={cn(HERO_CTA_MOBILE, 'flex-1')} onClick={() => onOpen(product.id)}>
            <Eye aria-hidden />
            Ver detalhes
          </Button>
          <Link
            to={catalogHref({ distributors: [product.distributor] })}
            aria-label={`Ver mais da marca ${distributorName}`}
            className={buttonVariants({
              variant: 'outline',
              size: 'lg',
              className: cn(INVERTED_OUTLINE, HERO_CTA_MOBILE, HERO_CTA_SECONDARY, 'group/brand'),
            })}
          >
            <span className="sm:hidden">Mais da marca</span>
            <span className="hidden sm:inline">Ver mais da marca</span>
            <ArrowRight
              aria-hidden
              className="hidden transition-transform duration-300 ease-out-expo group-hover/brand:translate-x-0.5 sm:block"
            />
          </Link>
        </m.div>
      </div>

      <div className="order-1 flex justify-center md:order-2 md:justify-end lg:h-full lg:items-center lg:[container-type:size]">
        <m.div
          custom={dir}
          variants={heroArtVariants}
          className="relative w-[min(52%,11.5rem,calc(22svh*5/6))] sm:w-[62%] sm:max-w-[17rem] md:w-full md:max-w-[21rem] lg:w-[min(100cqw,calc(100cqh*5/6))] lg:max-w-[29rem] max-sm:[@media(max-height:720px)]:w-[calc(18svh*5/6)]"
        >
          <div aria-hidden className="absolute inset-x-[12%] -bottom-6 h-10 rounded-[50%] bg-brand-500/35 blur-2xl" />
          <m.div animate={ghost ? undefined : FLOAT_ANIMATION} transition={FLOAT_TRANSITION} className="relative">
            {/* atalho de mouse para os detalhes (o botão "Ver detalhes" é o equivalente acessível) */}
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              onClick={() => onOpen(product.id)}
              className="group/art relative block aspect-[5/6] w-full cursor-pointer overflow-hidden rounded-[1.25rem] bg-ink-900 shadow-[0_50px_100px_-30px_rgb(0_0_0/0.95),0_30px_70px_-45px_rgb(0_102_255/0.7)] ring-1 ring-white/10 sm:rounded-[1.75rem]"
            >
              {!ghost && (
                <ProductImage
                  path={product.images[0]}
                  alt=""
                  sizes={HERO_ART_SIZES}
                  className="transition-[opacity,scale] duration-700 ease-out-expo group-hover/art:scale-[1.03]"
                />
              )}
            </button>
          </m.div>
        </m.div>
      </div>
    </div>
  )
}
