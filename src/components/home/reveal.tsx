import { m } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE_OUT_EXPO } from './motion'

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
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </m.div>
  )
}
