import { m, type HTMLMotionProps, type Variants } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE_OUT_EXPO } from './motion'

const VIEWPORT = { once: true, margin: '0px 0px -8% 0px' } as const

export interface RevealProps {
  children: ReactNode
  className?: string
  /** atraso em segundos (para escalonar itens de uma grade) */
  delay?: number
  /** deslocamento vertical inicial em px */
  y?: number
}

/** Entrada sutil (opacity + leve subida) quando o bloco entra na viewport — uma vez só. */
export function Reveal({ children, className, delay = 0, y = 16 }: RevealProps) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </m.div>
  )
}

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT_EXPO } },
}

/**
 * Lista com entrada escalonada controlada pela própria lista (use com `RevealItem`).
 * Serve para trilhos horizontais: os itens fora da tela (cortados pela rolagem) entram
 * junto com a lista, em vez de ficarem invisíveis até serem arrastados para a vista.
 */
export function RevealList(props: HTMLMotionProps<'ul'>) {
  return <m.ul initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={listVariants} {...props} />
}

export function RevealItem(props: HTMLMotionProps<'li'>) {
  return <m.li variants={itemVariants} {...props} />
}
