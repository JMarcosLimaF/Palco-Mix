import { Link2, Lock } from 'lucide-react'
import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Field, Input, Textarea } from '@/components/ui/form'
import { useMediaQuery } from '@/hooks/use-media-query'
import { errorMessage, ServiceError } from '@/services/errors'
import { normalizeText, slugify } from '@/lib/utils'
import { DESCRIPTION_MAX, NAME_MAX, type TaxonomyCopy } from './config'
import { hasDuplicateName, previewId } from './logic'
import { CharCount } from './taxonomy-ui'
import type {
  ExtraFieldsProps,
  ExtraValues,
  FieldErrors,
  FormValues,
  TaxonomyEntityBase,
  TaxonomyFormLogic,
  TaxonomyInputBase,
} from './types'

export interface TaxonomyFormProps<T extends TaxonomyEntityBase, I extends TaxonomyInputBase, X extends ExtraValues> {
  /** id do <form> — o botão de envio fica no rodapé do modal (atributo `form`) */
  formId: string
  copy: TaxonomyCopy
  /** null = cadastro novo */
  entity: T | null
  /** todos os itens (prévia do identificador e checagem de nome duplicado) */
  items: readonly T[]
  logic: TaxonomyFormLogic<T, I, X>
  renderFields: (props: ExtraFieldsProps<X>) => ReactNode
  /** rejeita com ServiceError('conflict') quando o nome já existe */
  onSubmit: (input: I) => Promise<unknown>
  submitting: boolean
}

/**
 * Formulário de Categoria/Distribuidor: Nome + Descrição (comuns) e campos
 * extras injetados por tipo. Validação inline; Enter envia (Ctrl/⌘+Enter no texto longo).
 */
export function TaxonomyForm<T extends TaxonomyEntityBase, I extends TaxonomyInputBase, X extends ExtraValues>({
  formId,
  copy,
  entity,
  items,
  logic,
  renderFields,
  onSubmit,
  submitting,
}: TaxonomyFormProps<T, I, X>) {
  const [values, setValues] = useState<FormValues<X>>(() => ({
    name: entity?.name ?? '',
    description: entity?.description ?? '',
    ...(entity ? logic.extraFromEntity(entity) : logic.emptyExtra),
  }))
  const [errors, setErrors] = useState<FieldErrors<FormValues<X>>>({})
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  // no celular, não abre o teclado sozinho por cima do bottom sheet
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')

  const takenIds = useMemo(() => new Set(items.map((item) => item.id)), [items])
  const identifier = entity ? entity.id : values.name.trim() ? previewId(values.name, takenIds) : ''

  function nameError(name: string): string | undefined {
    const normalized = normalizeText(name)
    if (!normalized) return copy.nameRequired
    if (normalized.length < 2) return 'Use pelo menos 2 caracteres.'
    if (!slugify(name)) return 'Use letras ou números no nome.'
    if (hasDuplicateName(name, items, entity?.id)) return copy.nameTaken
    return undefined
  }

  function validateAll(current: FormValues<X>): FieldErrors<FormValues<X>> {
    const found: FieldErrors<FormValues<X>> = { ...logic.validateExtra(current) }
    const nameMessage = nameError(current.name)
    if (nameMessage) found.name = nameMessage
    return found
  }

  function setValue(field: keyof FormValues<X>, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }) as FormValues<X>)
    // o erro some enquanto a pessoa corrige; volta a ser checado ao sair do campo/enviar
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  function validateField(field: keyof FormValues<X>) {
    let message: string | undefined
    if (field === 'name') {
      // campo vazio só é cobrado no envio (não incomoda quem só passou pelo campo)
      message = values.name.trim() ? nameError(values.name) : undefined
    } else if (field !== 'description') {
      message = logic.validateExtra(values)[field as keyof X]
    }
    setErrors((prev) => (prev[field] === message ? prev : { ...prev, [field]: message }))
  }

  function focusFirstInvalid() {
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const found = validateAll(values)
    setErrors(found)
    if (Object.values(found).some(Boolean)) {
      focusFirstInvalid()
      return
    }
    try {
      await onSubmit(logic.toInput(values))
    } catch (error) {
      // conflito de nome (ou validação do service) aparece no próprio campo
      if (error instanceof ServiceError && (error.code === 'conflict' || error.code === 'validation')) {
        setErrors((prev) => ({ ...prev, name: error.message }))
        requestAnimationFrame(() => nameRef.current?.focus())
      } else {
        toast.error(errorMessage(error))
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
    const target = event.target as HTMLElement
    // ignora eventos que "borbulham" de diálogos aninhados (ex: biblioteca de imagens)
    if (!event.currentTarget.contains(target)) return
    const isTextarea = target instanceof HTMLTextAreaElement
    const isInput = target instanceof HTMLInputElement
    if ((isInput && !event.shiftKey) || (isTextarea && (event.metaKey || event.ctrlKey))) {
      event.preventDefault()
      event.currentTarget.requestSubmit()
    }
  }

  return (
    <form
      id={formId}
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-5 pt-2"
      aria-busy={submitting || undefined}
    >
      <div className="flex flex-col gap-2">
        <Field label="Nome" required error={errors.name} aside={<CharCount length={values.name.length} max={NAME_MAX} />}>
          <Input
            ref={nameRef}
            value={values.name}
            onChange={(e) => setValue('name', e.target.value)}
            onBlur={() => validateField('name')}
            placeholder={copy.namePlaceholder}
            maxLength={NAME_MAX}
            autoComplete="off"
            autoFocus={finePointer}
            readOnly={submitting}
          />
        </Field>

        <p className="flex min-w-0 items-start gap-1.5 text-xs leading-relaxed text-subtle">
          {entity ? (
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          ) : (
            <Link2 className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          )}
          <span className="min-w-0">
            Identificador{' '}
            <code className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.6875rem] break-all text-fg">
              {identifier || '…'}
            </code>{' '}
            {entity
              ? '· mantido ao renomear, para não quebrar links nem produtos vinculados.'
              : identifier
                ? `· gerado a partir do nome e ${copy.idHint}.`
                : '· será gerado a partir do nome.'}
          </span>
        </p>
      </div>

      <Field
        label="Descrição"
        error={errors.description}
        aside={<CharCount length={values.description.length} max={DESCRIPTION_MAX} />}
      >
        <Textarea
          rows={3}
          value={values.description}
          onChange={(e) => setValue('description', e.target.value)}
          placeholder={copy.descriptionPlaceholder}
          maxLength={DESCRIPTION_MAX}
          className="resize-none"
          readOnly={submitting}
        />
      </Field>

      {renderFields({
        values,
        errors: errors as FieldErrors<X>,
        setValue: (field, value) => setValue(field, value),
        validateField: (field) => validateField(field),
        disabled: submitting,
      })}
    </form>
  )
}
