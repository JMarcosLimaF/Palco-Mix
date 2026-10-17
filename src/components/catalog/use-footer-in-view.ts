import { useEffect, useState } from 'react'

/**
 * true enquanto o rodapé do site está visível — barras fixas inferiores saem
 * do caminho (o rodapé tem o próprio CTA de WhatsApp e não pode ficar coberto).
 */
export function useFooterInView() {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const footer = document.querySelector('footer')
    if (!footer || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    io.observe(footer)
    return () => io.disconnect()
  }, [])
  return inView
}
