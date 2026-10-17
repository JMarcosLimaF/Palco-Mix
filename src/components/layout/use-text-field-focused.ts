import { useSyncExternalStore } from 'react'

/** Tipos de <input> que não abrem o teclado virtual. */
const NON_TEXT_INPUTS = new Set(['checkbox', 'radio', 'range', 'color', 'file', 'button', 'submit', 'reset', 'image', 'hidden'])

function isTextField(el: Element | null): boolean {
  // campos dentro de diálogos (busca em tela cheia, modais) não contam: a página por trás já está coberta,
  // e manter a barra "viva" deixa o foco voltar ao botão que abriu o diálogo
  if (!el || el.closest('[role="dialog"]')) return false
  if (el instanceof HTMLTextAreaElement) return true
  if (el instanceof HTMLInputElement) return !NON_TEXT_INPUTS.has(el.type)
  return el instanceof HTMLElement && el.isContentEditable
}

function subscribe(onChange: () => void) {
  document.addEventListener('focusin', onChange)
  document.addEventListener('focusout', onChange)
  return () => {
    document.removeEventListener('focusin', onChange)
    document.removeEventListener('focusout', onChange)
  }
}

/**
 * `true` enquanto um campo de texto da página (fora de diálogos) está focado — no celular,
 * é quando o teclado virtual está aberto (barras fixas inferiores saem do caminho).
 */
export function useTextFieldFocused(): boolean {
  return useSyncExternalStore(subscribe, () => isTextField(document.activeElement), () => false)
}
