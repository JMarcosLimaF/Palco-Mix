import { useCallback, useEffect, useState } from 'react'

export interface HideOnScrollOptions {
  enabled: boolean
  /** até aqui (px) o elemento fica sempre visível */
  threshold?: number
  /** rolagem mínima (px) num sentido para trocar de estado — ignora tremidas */
  tolerance?: number
  /** condição extra para poder esconder (ex.: nada da página depende da posição atual) */
  canHide?: () => boolean
}

/**
 * Esconde ao rolar para baixo e mostra ao rolar para cima (cabeçalho do celular).
 * Listener passivo + rAF; re-render só quando o estado muda.
 * Retorna [oculto, revelar] — `revelar` mostra de novo (foco por teclado, troca de página).
 */
export function useHideOnScroll({ enabled, threshold = 120, tolerance = 8, canHide }: HideOnScrollOptions) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let lastY = window.scrollY
    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      if (y <= threshold) {
        setHidden(false)
        lastY = y
        return
      }
      const delta = y - lastY
      if (Math.abs(delta) < tolerance) return
      lastY = y
      setHidden(delta > 0 && (canHide?.() ?? true))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [enabled, threshold, tolerance, canHide])

  const reveal = useCallback(() => setHidden(false), [])
  return [enabled && hidden, reveal] as const
}
