import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useMediaQuery } from '@/hooks/use-media-query'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  /** alterna claro ↔ escuro considerando o tema efetivo atual */
  toggle: () => void
}

const prefersDark = () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode
}

export function applyTheme(mode: ThemeMode) {
  const dark = resolveTheme(mode) === 'dark'
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0A0A0B' : '#FFFFFF')
}

/** A chave 'palcomix:theme' também é lida pelo script inline do index.html. */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      setMode: (mode) => set({ mode }),
      toggle: () => set({ mode: resolveTheme(get().mode) === 'dark' ? 'light' : 'dark' }),
    }),
    { name: 'palcomix:theme', version: 1 },
  ),
)

/**
 * Tema efetivo reativo: no modo "system" acompanha a troca de tema do SO
 * (resolveTheme só lê o SO no momento da chamada).
 */
export function useResolvedTheme(): 'light' | 'dark' {
  const mode = useThemeStore((s) => s.mode)
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  return mode === 'system' ? (systemDark ? 'dark' : 'light') : mode
}
