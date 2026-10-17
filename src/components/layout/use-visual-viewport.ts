import { useEffect, useState } from 'react'

export interface VisualViewportBox {
  height: number
  offsetTop: number
}

function read(): VisualViewportBox | null {
  const vv = typeof window === 'undefined' ? null : window.visualViewport
  // com zoom de pinça a visualViewport não corresponde ao layout: deixa o CSS decidir
  if (!vv || Math.abs(vv.scale - 1) > 0.01) return null
  return { height: vv.height, offsetTop: vv.offsetTop }
}

/**
 * Área realmente visível da tela. No iOS o teclado virtual não encolhe o layout:
 * só a visualViewport diminui — camadas em tela cheia usam isto para manter
 * campo, sugestões e ações acima do teclado. `null` sem suporte (ou com zoom de pinça).
 */
export function useVisualViewport(): VisualViewportBox | null {
  const [box, setBox] = useState(read)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() =>
        setBox((prev) => {
          const next = read()
          return prev && next && prev.height === next.height && prev.offsetTop === next.offsetTop ? prev : next
        }),
      )
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      cancelAnimationFrame(frame)
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return box
}
