import { useEffect } from 'react'
import { site } from '@/config/site'

/** Define o <title> da página: "Tênis · Palco Mix". Sem argumento → título padrão. */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    const full = title ? `${title} · ${site.name}` : `${site.name} · ${site.tagline}`
    document.title = full
  }, [title])
}
