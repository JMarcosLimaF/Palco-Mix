import { m } from 'motion/react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { ADMIN_NAV_ITEMS } from './admin-nav-items'

export interface AdminNavProps {
  /**
   * Identificador da pílula animada. Sidebar e menu mobile usam valores
   * diferentes para que a pílula não "voe" de um para o outro.
   */
  pillId: string
  /** chamado ao clicar num item (ex.: fechar o menu mobile) */
  onNavigate?: () => void
  className?: string
}

/** Lista de navegação do painel com pílula ativa animada (layoutId). */
export function AdminNav({ pillId, onNavigate, className }: AdminNavProps) {
  return (
    <ul className={cn('flex flex-col gap-1', className)}>
      {ADMIN_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <li key={to}>
          <NavLink
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group/nav relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold outline-offset-2',
                'transition-colors duration-200 ease-out-expo',
                isActive ? 'text-brand-600 dark:text-brand-300' : 'text-muted hover:bg-surface-2 hover:text-fg',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <m.span
                    layoutId={pillId}
                    aria-hidden
                    className="absolute inset-0 rounded-xl bg-brand-500/[0.08] ring-1 ring-brand-500/15 dark:bg-brand-500/[0.14] dark:ring-brand-400/20"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
                  >
                    <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500" />
                  </m.span>
                )}
                <Icon
                  aria-hidden
                  className={cn(
                    'relative size-[1.15rem] shrink-0 transition-transform duration-300 ease-out-expo',
                    !isActive && 'group-hover/nav:-translate-y-px',
                  )}
                  strokeWidth={isActive ? 2.3 : 2}
                />
                <span className="relative truncate">{label}</span>
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}
