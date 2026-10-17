import { Eye, EyeOff, Trash2, X } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { Button } from '@/components/ui/button'
import { cn, pluralize } from '@/lib/utils'

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

/** Botão de ação: no celular, ícone sobre o rótulo em 3 colunas iguais (alvos grandes); sm+: pílula compacta. */
const actionBtn =
  'px-3 text-white hover:bg-white/10 max-sm:h-14 max-sm:w-full max-sm:flex-col max-sm:gap-1 max-sm:rounded-2xl ' +
  'max-sm:bg-white/[0.07] max-sm:px-1 max-sm:text-xs max-sm:[&_svg]:size-[1.15rem]'

const clearBtn =
  'inline-flex shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400'

/**
 * Barra flutuante de ações em lote. Fica "grudada" no rodapé da área visível
 * enquanto houver seleção; no fim da página ocupa seu lugar no fluxo (não cobre a paginação).
 * No celular vira um painel de duas linhas: contagem + limpar, e as três ações com rótulo.
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
            className={cn(
              'pointer-events-auto grid w-full grid-cols-3 gap-1.5 rounded-3xl bg-ink-950 p-2 text-white shadow-pop ring-1 ring-white/10 dark:bg-ink-850',
              'sm:flex sm:w-auto sm:max-w-full sm:items-center sm:gap-1 sm:rounded-full sm:p-1.5 sm:pl-4',
            )}
          >
            <p
              className="col-span-2 self-center pl-2.5 text-sm font-semibold whitespace-nowrap tabular-nums sm:mr-1 sm:pl-0"
              aria-live="polite"
            >
              {pluralize(count, 'selecionado', 'selecionados')}
            </p>
            {/* celular: "limpar" no canto da 1ª linha (na ordem do DOM logo após a contagem) */}
            <button
              type="button"
              onClick={onClear}
              aria-label="Limpar seleção"
              title="Limpar seleção"
              className={cn(clearBtn, 'size-11 justify-self-end sm:hidden')}
            >
              <X className="size-[1.1rem]" aria-hidden />
            </button>
            <span className="mx-1 hidden h-5 w-px bg-white/15 sm:block" aria-hidden />
            <Button
              size="sm"
              variant="ghost"
              className={actionBtn}
              onClick={onActivate}
              disabled={inactiveCount === 0 || busy !== null}
              loading={busy === 'activate'}
              title={inactiveCount === 0 ? 'Todos os selecionados já estão ativos' : undefined}
            >
              {busy !== 'activate' && <Eye aria-hidden />}
              <span>Ativar</span>
              <span className="sr-only"> selecionados</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={actionBtn}
              onClick={onDeactivate}
              disabled={activeCount === 0 || busy !== null}
              loading={busy === 'deactivate'}
              title={activeCount === 0 ? 'Todos os selecionados já estão inativos' : undefined}
            >
              {busy !== 'deactivate' && <EyeOff aria-hidden />}
              <span>Inativar</span>
              <span className="sr-only"> selecionados</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={cn(actionBtn, 'text-red-300 hover:bg-red-500/20 hover:text-red-200')}
              onClick={onDelete}
              disabled={busy !== null}
            >
              <Trash2 aria-hidden />
              <span>Excluir</span>
              <span className="sr-only"> selecionados</span>
            </Button>
            <button
              type="button"
              onClick={onClear}
              aria-label="Limpar seleção"
              title="Limpar seleção"
              className={cn(clearBtn, 'ml-0.5 size-9 max-sm:hidden')}
            >
              <X className="size-4" aria-hidden />
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
