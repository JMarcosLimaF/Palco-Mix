import { CircleAlert } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from './button'
import { Modal } from './modal'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  /** Conteúdo extra (ex: seletor de destino ao excluir categoria em uso) */
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  /** Pode ser assíncrono; o diálogo mostra carregamento e fecha ao concluir. */
  onConfirm: () => unknown | Promise<unknown>
  confirmDisabled?: boolean
}

/** Modal de confirmação de segurança para ações destrutivas. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  confirmDisabled,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)

  async function handleConfirm() {
    setBusy(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      /* quem chamou exibe o erro (toast); mantém aberto */
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title={title}
      hideHeader
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={handleConfirm} loading={busy} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-3 pt-4 text-center sm:items-start sm:pt-2 sm:text-left">
        <span
          className={
            tone === 'danger'
              ? 'inline-flex size-12 items-center justify-center rounded-2xl bg-red-500/10 text-danger-500'
              : 'inline-flex size-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500'
          }
        >
          <CircleAlert className="size-6" aria-hidden />
        </span>
        <h2 className="text-lg font-bold tracking-tight" aria-hidden>
          {title}
        </h2>
        {description && <div className="text-sm leading-relaxed text-muted">{description}</div>}
        {children && <div className="w-full pt-1 text-left">{children}</div>}
      </div>
    </Modal>
  )
}
