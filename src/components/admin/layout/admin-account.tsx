import { ArrowUpRight, LogOut, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { appHref } from '@/lib/base-path'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { userInitials } from './admin-nav-items'
import { useAdminLogout } from './use-admin-logout'

/** Abre a vitrine pública em nova aba. */
export function ViewStoreLink({ className }: { className?: string }) {
  return (
    <a
      href={appHref('/')}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group/store flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted',
        'transition-colors duration-200 ease-out-expo hover:bg-surface-2 hover:text-fg',
        className,
      )}
    >
      <Store className="size-[1.15rem] shrink-0" aria-hidden />
      <span className="flex-1">Ver loja</span>
      <ArrowUpRight
        className="size-4 shrink-0 text-subtle transition-transform duration-300 ease-out-expo group-hover/store:translate-x-0.5 group-hover/store:-translate-y-0.5 group-hover/store:text-brand-500"
        aria-hidden
      />
      <span className="sr-only">(abre em nova aba)</span>
    </a>
  )
}

/** Cartão do usuário logado com avatar de iniciais e botão "Sair". */
export function AdminUserCard({ className }: { className?: string }) {
  const user = useAuthStore((s) => s.user)
  const logout = useAdminLogout()
  if (!user) return null

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-line bg-elevated p-2 pl-2.5 shadow-card',
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-950 text-[0.7rem] font-extrabold tracking-wide text-white ring-2 ring-brand-500/40 ring-offset-2 ring-offset-elevated dark:bg-white dark:text-ink-950"
      >
        {userInitials(user.name)}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-bold text-fg">{user.name}</p>
        <p className="truncate text-xs text-subtle">@{user.username}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        aria-label="Sair do painel"
        title="Sair"
        className="text-muted hover:text-danger-500"
      >
        <LogOut aria-hidden />
      </Button>
    </div>
  )
}
