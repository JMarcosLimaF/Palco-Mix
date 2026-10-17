import { Moon, Sun } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useResolvedTheme, useThemeStore } from '@/store/theme'
import { cn } from '@/lib/utils'

/** Alterna claro/escuro com transição do ícone. */
export function ThemeToggle({ className }: { className?: string }) {
  const toggle = useThemeStore((s) => s.toggle)
  const isDark = useResolvedTheme() === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
      className={cn(
        'relative inline-flex size-10 items-center justify-center overflow-hidden rounded-full text-fg transition-colors hover:bg-surface-2',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={isDark ? 'moon' : 'sun'}
          initial={{ y: 14, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -14, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex"
        >
          {isDark ? <Moon className="size-[1.15rem]" /> : <Sun className="size-[1.15rem]" />}
        </m.span>
      </AnimatePresence>
    </button>
  )
}
