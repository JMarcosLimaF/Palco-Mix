import { ArrowRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Field, Select } from '@/components/ui/form'
import { pluralize } from '@/lib/utils'
import type { TaxonomyCopy } from './config'
import type { TaxonomyEntityBase } from './types'

export interface TaxonomyDeleteDialogProps<T extends TaxonomyEntityBase> {
  open: boolean
  onOpenChange: (open: boolean) => void
  copy: TaxonomyCopy
  target: T | null
  /** produtos vinculados ao item que será excluído */
  count: number
  /** destinos possíveis (todos os outros itens, já ordenados) */
  candidates: readonly T[]
  usage: Record<string, number>
  reassignTo: string
  onReassignChange: (id: string) => void
  /** pode rejeitar — o diálogo continua aberto */
  onConfirm: () => Promise<void>
  /** sem destino possível: atalho para cadastrar um novo */
  onCreateInstead: () => void
}

/**
 * Exclusão segura: sem produtos → confirmação simples; com produtos → exige
 * escolher para onde movê-los (o service realoca antes de excluir).
 */
export function TaxonomyDeleteDialog<T extends TaxonomyEntityBase>({
  open,
  onOpenChange,
  copy,
  target,
  count,
  candidates,
  usage,
  reassignTo,
  onReassignChange,
  onConfirm,
  onCreateInstead,
}: TaxonomyDeleteDialogProps<T>) {
  const name = target?.name ?? ''
  const inUse = count > 0
  const destination = candidates.find((c) => c.id === reassignTo)

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Excluir ${copy.singular} “${name}”?`}
      description={
        inUse ? (
          <>
            <strong className="font-semibold text-fg">{pluralize(count, 'produto usa', 'produtos usam')}</strong>{' '}
            {copy.demonstrative} {copy.singular}. Escolha para onde movê-los antes de excluir — eles continuam no
            catálogo.
          </>
        ) : (
          'Esta ação não pode ser desfeita.'
        )
      }
      confirmLabel={inUse ? 'Mover e excluir' : 'Excluir'}
      confirmDisabled={inUse && !destination}
      onConfirm={onConfirm}
    >
      {inUse &&
        (candidates.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-surface-2 p-4 text-sm text-muted">
            <p>
              Não há {copy.other} {copy.singular} para receber os produtos. Cadastre {copy.other === 'outra' ? 'uma nova' : 'um novo'}{' '}
              antes de excluir {copy.demonstrative}.
            </p>
            <Button size="sm" variant="outline" className="max-sm:h-11" onClick={onCreateInstead}>
              <Plus aria-hidden />
              {copy.newLabel}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Field label="Mover produtos para…" required>
              <Select value={reassignTo} onChange={(e) => onReassignChange(e.target.value)}>
                <option value="" disabled>
                  {copy.selectTarget}
                </option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name} · {pluralize(usage[candidate.id] ?? 0, 'produto', 'produtos')}
                  </option>
                ))}
              </Select>
            </Field>
            {destination ? (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-surface-2 px-3 py-2.5 text-xs text-muted">
                <span className="font-semibold text-fg tabular-nums">{pluralize(count, 'produto', 'produtos')}</span>
                <span className="sr-only">de</span>
                <span className="max-w-[10rem] truncate line-through decoration-danger-500/60">{name}</span>
                <ArrowRight className="size-3.5 shrink-0 text-brand-500" aria-hidden />
                <span className="sr-only">para</span>
                <span className="max-w-[10rem] truncate font-semibold text-fg">{destination.name}</span>
              </p>
            ) : null}
            <p className="text-xs text-subtle">A exclusão não pode ser desfeita.</p>
          </div>
        ))}
    </ConfirmDialog>
  )
}
