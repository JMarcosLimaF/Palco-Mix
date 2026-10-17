import { Eye, EyeOff, Trash2, X } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { Button } from '@/components/ui/button'
import { pluralize } from '@/lib/utils'

export interface BulkActionsBarProps {
  count: number
  /** quantos selecionados estão inativos / ativos (habilita as ações que fazem sentido) */
  inactiveCount: number
  activeCount: number
  busy: 'activate' | 'deactivate' | null
  onActivate: () => void
  onDeactivate: () => void
  onDelete: () => void
  onClear: () => void
}

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Barra flutuante de ações em lote. Fica "grudada" no rodapé da área visível
 * enquanto houver seleção; no fim da página ocupa seu lugar no fluxo (não cobre a paginação).
 */
export function BulkActionsBar({
  count,
  inactiveCount,
  activeCount,
  busy,
  onActivate,
  onDeactivate,
  onDelete,
  onClear,
}: BulkActionsBarProps) {
  return (
    <div className="pointer-events-none sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex justify-center">
      <AnimatePresence>
        {count > 0 && (
          <m.div
            key="bulk-bar"
            role="region"
            aria-label="Ações em lote"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: EASE } }}
            exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.18 } }}
            className="pointer-events-auto flex max-w-full items-center gap-1 rounded-full bg-ink-950 p-1.5 pl-4 text-white shadow-pop ring-1 ring-white/10 dark:bg-ink-850"
          >
            <p className="mr-1 text-sm font-semibold whitespace-nowrap tabular-nums" aria-live="polite">
              {pluralize(count, 'selecionado', 'selecionados')}
            </p>
            <span className="mx-1 hidden h-5 w-px bg-white/15 sm:block" aria-hidden />
            <Button
              size="sm"
              variant="ghost"
              className="px-3 text-white hover:bg-white/10"
              onClick={onActivate}
              disabled={inactiveCount === 0 || busy !== null}
              loading={busy === 'activate'}
              title={inactiveCount === 0 ? 'Todos os selecionados já estão ativos' : undefined}
            >
              {busy !== 'activate' && <Eye aria-hidden />}
              <span className="hidden sm:inline">Ativar</span>
              <span className="sr-only sm:hidden">Ativar selecionados</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="px-3 text-white hover:bg-white/10"
              onClick={onDeactivate}
              disabled={activeCount === 0 || busy !== null}
              loading={busy === 'deactivate'}
              title={activeCount === 0 ? 'Todos os selecionados já estão inativos' : undefined}
            >
              {busy !== 'deactivate' && <EyeOff aria-hidden />}
              <span className="hidden sm:inline">Inativar</span>
              <span className="sr-only sm:hidden">Inativar selecionados</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="px-3 text-red-300 hover:bg-red-500/20 hover:text-red-200"
              onClick={onDelete}
              disabled={busy !== null}
            >
              <Trash2 aria-hidden />
              <span className="hidden sm:inline">Excluir</span>
              <span className="sr-only sm:hidden">Excluir selecionados</span>
            </Button>
            <button
              type="button"
              onClick={onClear}
              aria-label="Limpar seleção"
              title="Limpar seleção"
              className="ml-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
            >
              <X className="size-4" aria-hidden />
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
