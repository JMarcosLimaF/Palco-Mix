import { useEffect, useState, type RefObject } from 'react'

/**
 * true enquanto uma barra `sticky` está grudada no topo.
 * Observa um sentinela (elemento de 1px logo antes da barra): quando ele passa
 * acima de `offset` px (altura do cabeçalho fixo do site), a barra grudou.
 */
export function useStuck(sentinelRef: RefObject<HTMLElement | null>, offset: number) {
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < offset),
      { rootMargin: `-${offset}px 0px 0px 0px`, threshold: 0 },
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [sentinelRef, offset])

  return stuck
}
