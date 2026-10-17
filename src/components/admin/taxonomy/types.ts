/**
 * Tipos do gerenciador genérico de taxonomias (Categorias e Distribuidores).
 *
 * O `TaxonomyManager` cuida de tudo que é comum (busca, ordenação, modal de
 * cadastro/edição, exclusão com realocação de produtos); cada tipo injeta só
 * o que muda: campos extras do formulário e o layout da listagem.
 */

export type TaxonomyKind = 'categories' | 'distributors'

export type TaxonomySort = 'name' | 'usage' | 'recent'

/** Campos comuns a Categoria e Distribuidor. */
export interface TaxonomyEntityBase {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt?: string
}

export interface TaxonomyInputBase {
  name: string
  description?: string
}

/** Valores extras do formulário (além de nome e descrição) — sempre strings controladas. */
export type ExtraValues = Record<string, string>

export interface BaseFormValues {
  name: string
  description: string
}

export type FormValues<X extends ExtraValues> = BaseFormValues & X

export type FieldErrors<V> = Partial<Record<keyof V, string>>

/** Regras puras do formulário de um tipo (sem JSX). */
export interface TaxonomyFormLogic<T extends TaxonomyEntityBase, I extends TaxonomyInputBase, X extends ExtraValues> {
  /** valores extras de um cadastro novo */
  emptyExtra: X
  /** valores extras ao editar */
  extraFromEntity: (entity: T) => X
  /** valida os campos extras (mensagens em pt-BR) */
  validateExtra: (values: X) => FieldErrors<X>
  /** converte o formulário no payload do service */
  toInput: (values: FormValues<X>) => I
}

/** Props recebidas pelo renderizador dos campos extras do formulário. */
export interface ExtraFieldsProps<X extends ExtraValues> {
  values: X
  errors: FieldErrors<X>
  setValue: (field: keyof X, value: string) => void
  /** valida um campo isolado (ex: ao sair dele) */
  validateField: (field: keyof X) => void
  disabled: boolean
}

/** Props recebidas pelo renderizador da listagem. */
export interface TaxonomyListProps<T extends TaxonomyEntityBase> {
  /** já filtrados e ordenados */
  items: T[]
  /** id → quantidade de produtos vinculados */
  usage: Record<string, number>
  /** item recém-salvo (recebe destaque visual por alguns instantes) */
  highlightId: string | null
  onEdit: (item: T) => void
  onDelete: (item: T) => void
}

/** Subconjunto de `UseQueryResult` usado pelo gerenciador. */
export interface QueryLike<D> {
  data: D | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => unknown
}

/** Subconjunto de `UseMutationResult` usado pelo gerenciador. */
export interface MutationLike<V, R> {
  mutateAsync: (variables: V) => Promise<R>
  isPending: boolean
}

export interface SaveVariables<I> {
  id?: string
  input: I
}

export interface RemoveVariables {
  id: string
  reassignTo?: string
}
