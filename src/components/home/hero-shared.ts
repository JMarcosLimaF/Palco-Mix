/** Constantes, tipos e variantes de animação do HeroCarousel. */
import type { Transition, Variants } from 'motion/react'
import type { Product } from '@/types/catalog'
import { EASE_OUT_EXPO } from './motion'

export type HeroSlide = { kind: 'brand'; key: string } | { kind: 'product'; key: string; product: Product }

export const BRAND_SLIDE: HeroSlide = { kind: 'brand', key: 'palco-mix' }

/** Quantos destaques viram slides (além do slide de marca). */
export const HERO_FEATURED_LIMIT = 6
export const AUTOPLAY_MS = 6500
/** Arraste mínimo (px) ou velocidade (px/s) para trocar de slide. */
export const SWIPE_OFFSET = 72
export const SWIPE_VELOCITY = 450

/** Largura real da arte do produto em cada layout (srcset). No celular a arte ocupa ~42% da largura. */
export const HERO_ART_SIZES = '(min-width: 1024px) 460px, (min-width: 768px) 340px, 44vw'
/** Cartões da composição do slide de marca (o maior tem ~30% da largura no celular). */
export const HERO_STACK_SIZES = '(min-width: 1024px) 280px, (min-width: 768px) 200px, 32vw'

export const HERO_WHATSAPP_MESSAGE = 'Olá, Palco Mix! Vim pelo site e quero fazer um pedido.'

/** Botão outline em branco para fundos escuros. */
export const INVERTED_OUTLINE = 'border-white/25 text-white hover:border-white/60 hover:bg-white/10'

/** Botão circular "vidro" dos controles. */
export const GLASS_BUTTON =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md ' +
  'transition-[background-color,transform,box-shadow] duration-300 ease-out-expo hover:bg-white/20 hover:ring-white/30 active:scale-95 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [&_svg]:size-[1.15rem]'

/**
 * Preço grande sobre o painel escuro. A classe `dark` põe o <Price> no tema escuro nos dois
 * temas (tokens fg/muted/subtle e variantes dark:), sem depender da ordem dos spans internos
 * (preço à vista, "a prazo", selo); só o tamanho do preço principal é ajustado aqui.
 */
export const HERO_PRICE_CLASS = 'dark [&>span:first-child]:text-[1.75rem] sm:[&>span:first-child]:text-[2.5rem]'

/** Flutuação suave da arte (desligada pelo MotionConfig em "reduzir movimento"). */
export const FLOAT_ANIMATION = { y: [0, -10, 0] }
export const FLOAT_TRANSITION: Transition = { duration: 7, repeat: Infinity, ease: 'easeInOut' }

// `dir` = 1 avançando, -1 voltando. Filhos herdam os rótulos enter/center/exit do slide.
export const heroSlideVariants: Variants = {
  enter: { opacity: 0 },
  center: {
    opacity: 1,
    transition: { duration: 0.5, ease: EASE_OUT_EXPO, staggerChildren: 0.06, delayChildren: 0.04 },
  },
  exit: { opacity: 0, transition: { duration: 0.32, ease: EASE_OUT_EXPO } },
}

export const heroItemVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: 28 * dir }),
  center: { opacity: 1, x: 0, transition: { duration: 0.65, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export const heroArtVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: 64 * dir, scale: 0.92, rotate: 4 * dir }),
  center: { opacity: 1, x: 0, scale: 1, rotate: 0, transition: { duration: 0.9, ease: EASE_OUT_EXPO } },
  exit: (dir: number) => ({ opacity: 0, x: -48 * dir, scale: 0.96, transition: { duration: 0.35, ease: EASE_OUT_EXPO } }),
}

export const heroStackVariants: Variants = {
  enter: { opacity: 0, y: 36, scale: 0.94 },
  center: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.85, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
}

export const heroBackdropVariants: Variants = {
  enter: { opacity: 0, scale: 1.04 },
  center: { opacity: 1, scale: 1, transition: { duration: 0.9, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
}

export function padIndex(n: number): string {
  return String(n).padStart(2, '0')
}

/** Foco veio do teclado? (clique/toque não pausa o autoplay; Tab pausa). */
export function isFocusVisible(element: Element): boolean {
  try {
    return element.matches(':focus-visible')
  } catch {
    return true
  }
}

export function slideLabel(slide: HeroSlide): string {
  return slide.kind === 'brand' ? 'Palco Mix' : slide.product.name
}
