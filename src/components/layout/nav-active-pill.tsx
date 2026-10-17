import { m } from 'motion/react'

/** Pílula do item ativo da navegação desktop — desliza entre os itens (layoutId). */
export function NavActivePill() {
  return (
    <m.span
      layoutId="header-nav-active"
      aria-hidden
      className="absolute inset-0 -z-10 rounded-full bg-surface-2 ring-1 ring-line/70"
      transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
    />
  )
}
