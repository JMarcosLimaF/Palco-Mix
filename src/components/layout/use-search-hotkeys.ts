import { useEffect, useEffectEvent } from 'react'
import { isEditableTarget } from './search-utils'

/**
 * Atalhos globais da busca: "/" e Cmd/Ctrl+K.
 * Ignorados enquanto se digita em outro campo ou com um diálogo aberto.
 */
export function useSearchHotkeys(onTrigger: () => void) {
  const trigger = useEffectEvent(onTrigger)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.repeat) return
      const isSlash = event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey
      const isCmdK = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey
      if (!isSlash && !isCmdK) return
      if (isEditableTarget(event.target)) return
      if (document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]')) return
      event.preventDefault()
      trigger()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
