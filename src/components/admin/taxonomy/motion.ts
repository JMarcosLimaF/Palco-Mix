import type { MotionProps } from 'motion/react'

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

/**
 * Entrada sutil em cascata + reordenação suave (layout) dos itens da listagem.
 * O atraso só vale na montagem; a reordenação usa a transição `layout`, sem atraso.
 */
export function listItemMotion(index: number): MotionProps {
  return {
    layout: 'position',
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.97, transition: { duration: 0.16, ease: 'easeOut' } },
    transition: {
      duration: 0.4,
      ease: EASE_OUT_EXPO,
      delay: Math.min(index, 10) * 0.035,
      layout: { duration: 0.4, ease: EASE_OUT_EXPO },
    },
  }
}

/** Entrada simples (linhas de tabela — sem layout, que não combina com <tr>). */
export function rowMotion(index: number): MotionProps {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3, ease: EASE_OUT_EXPO, delay: Math.min(index, 12) * 0.025 },
  }
}
