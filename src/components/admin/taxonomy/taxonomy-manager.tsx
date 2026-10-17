/**
 * Gerenciador genérico de Categorias e Distribuidores: cabeçalho com contagem,
 * busca instantânea, ordenação, listagem (layout injetado), modal de
 * cadastro/edição e exclusão com realocação de produtos.
 *
 * Suporta `?novo=1` na URL (atalho do painel): abre o cadastro e limpa o parâmetro.
 */
import { CircleAlert, Plus, RefreshCw, SearchX, X } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { useCallback, useDeferredValue, useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/feedback'
import { Modal } from '@/components/ui/modal'
import { errorMessage } from '@/services/errors'
import { formatDate, pluralize } from '@/lib/utils'
import { TAXONOMY_COPY } from './config'
import { capitalize, filterAndSortTaxonomy, taxonomyDomId } from './logic'
import { TaxonomyDeleteDialog } from './taxonomy-delete-dialog'
import { TaxonomyForm } from './taxonomy-form'
import { TaxonomyToolbar } from './taxonomy-toolbar'
import { TaxonomyKindIcon } from './taxonomy-ui'
import type {
  ExtraFieldsProps,
  ExtraValues,
  MutationLike,
  QueryLike,
  RemoveVariables,
  SaveVariables,
  TaxonomyEntityBase,
  TaxonomyFormLogic,
  TaxonomyInputBase,
  TaxonomyKind,
  TaxonomyListProps,
  TaxonomySort,
} from './types'

export interface TaxonomyManagerProps<T extends TaxonomyEntityBase, I extends TaxonomyInputBase, X extends ExtraValues> {
  kind: TaxonomyKind
  list: QueryLike<T[]>
  usage: QueryLike<Record<string, number>>
  save: MutationLike<SaveVariables<I>, T>
  remove: MutationLike<RemoveVariables, { moved: number }>
  /** regras do formulário (valores, validação, payload) */
  form: TaxonomyFormLogic<T, I, X>
  /** campos extras do formulário (além de Nome e Descrição) */
  renderFields: (props: ExtraFieldsProps<X>) => ReactNode
  /** layout da listagem (grade, tabela…) */
  renderList: (props: TaxonomyListProps<T>) => ReactNode
  /** esqueleto com o mesmo formato da listagem */
  renderSkeleton: () => ReactNode
  /** texto extra considerado pela busca */
  searchText?: (item: T) => string
}

interface FormState<T> {
  open: boolean
  /** null = cadastro novo */
  entity: T | null
  /** muda a cada abertura → estado do formulário sempre limpo */
  session: number
}

interface DeleteState<T> {
  open: boolean
  target: T | null
  reassignTo: string
}

const EMPTY_USAGE: Record<string, number> = {}
const HIGHLIGHT_MS = 2400

export function TaxonomyManager<T extends TaxonomyEntityBase, I extends TaxonomyInputBase, X extends ExtraValues>({
  kind,
  list,
  usage,
  save,
  remove,
  form,
  renderFields,
  renderList,
  renderSkeleton,
  searchText,
}: TaxonomyManagerProps<T, I, X>) {
  const copy = TAXONOMY_COPY[kind]
  const formId = useId()
  const reduceMotion = useReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [sort, setSort] = useState<TaxonomySort>('name')
  const [formState, setFormState] = useState<FormState<T>>({ open: false, entity: null, session: 0 })
  const [deleteState, setDeleteState] = useState<DeleteState<T>>({ open: false, target: null, reassignTo: '' })
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const items = list.data
  const usageMap = usage.data ?? EMPTY_USAGE
  const allItems = useMemo(() => items ?? [], [items])
  const visible = useMemo(
    () => filterAndSortTaxonomy(allItems, { query: deferredSearch, sort, usage: usageMap, searchText }),
    [allItems, deferredSearch, sort, usageMap, searchText],
  )

  // ---------------------------------------------------------------- ações

  const openCreate = useCallback(() => {
    setFormState((s) => ({ open: true, entity: null, session: s.session + 1 }))
  }, [])

  const openEdit = useCallback((entity: T) => {
    setFormState((s) => ({ open: true, entity, session: s.session + 1 }))
  }, [])

  const openDelete = useCallback((target: T) => {
    setDeleteState({ open: true, target, reassignTo: '' })
  }, [])

  function closeForm() {
    setFormState((s) => ({ ...s, open: false }))
  }

  // ?novo=1 → abre o cadastro (ao entrar ou se a URL mudar com a página aberta)
  const createRequested = searchParams.get('novo') === '1'
  const [lastCreateRequest, setLastCreateRequest] = useState(false)
  if (createRequested !== lastCreateRequest) {
    setLastCreateRequest(createRequested)
    if (createRequested) setFormState((s) => ({ open: true, entity: null, session: s.session + 1 }))
  }
  useEffect(() => {
    if (!createRequested) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('novo')
        return next
      },
      { replace: true, preventScrollReset: true },
    )
  }, [createRequested, setSearchParams])

  // destaca e traz para a vista o item recém-salvo
  useEffect(() => {
    if (!highlightId) return
    document
      .getElementById(taxonomyDomId(kind, highlightId))
      ?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
    const timer = window.setTimeout(() => setHighlightId(null), HIGHLIGHT_MS)
    return () => window.clearTimeout(timer)
  }, [highlightId, kind, visible, reduceMotion])

  async function handleSave(input: I) {
    const editing = formState.entity
    const saved = await save.mutateAsync({ id: editing?.id, input })
    toast.success(`${capitalize(copy.singular)} “${saved.name}” ${editing ? copy.updated : copy.created}`)
    closeForm()
    // cadastro novo: limpa a busca para o item aparecer na lista
    if (!editing) setSearch('')
    setHighlightId(saved.id)
  }

  const deleteTarget = deleteState.target
  const deleteCount = deleteTarget ? (usageMap[deleteTarget.id] ?? 0) : 0
  const deleteCandidates = useMemo(
    () =>
      deleteTarget
        ? filterAndSortTaxonomy(
            allItems.filter((item) => item.id !== deleteTarget.id),
            { query: '', sort: 'name', usage: usageMap },
          )
        : [],
    [allItems, deleteTarget, usageMap],
  )

  async function handleDelete() {
    if (!deleteTarget) return
    const reassignTo = deleteCount > 0 ? deleteState.reassignTo : undefined
    try {
      const { moved } = await remove.mutateAsync({ id: deleteTarget.id, reassignTo })
      const destination = moved > 0 ? allItems.find((item) => item.id === reassignTo)?.name : undefined
      toast.success(
        moved > 0 && destination
          ? `${capitalize(copy.singular)} ${copy.deleted} · ${pluralize(moved, 'produto movido', 'produtos movidos')} para ${destination}`
          : `${capitalize(copy.singular)} “${deleteTarget.name}” ${copy.deleted}`,
      )
    } catch (error) {
      toast.error(errorMessage(error))
      throw error
    }
  }

  // ---------------------------------------------------------------- render

  const total = items?.length
  const query = deferredSearch.trim()
  const isFiltering = query.length > 0
  const isLoading = list.isLoading || (usage.isLoading && !usage.data)
  const status =
    total === undefined
      ? ''
      : isFiltering
        ? `${visible.length.toLocaleString('pt-BR')} de ${pluralize(total, copy.singular, copy.plural)}`
        : pluralize(total, copy.singular, copy.plural)

  let content: ReactNode
  if (isLoading) {
    content = (
      <div>
        <span role="status" className="sr-only">
          Carregando {copy.plural}…
        </span>
        {renderSkeleton()}
      </div>
    )
  } else if (list.isError) {
    content = (
      <EmptyState
        className="rounded-2xl border border-dashed border-line-strong"
        icon={<CircleAlert className="size-7" aria-hidden />}
        title={`Não foi possível carregar as ${copy.plural}`}
        description="Verifique sua conexão e tente de novo."
        action={
          <Button variant="outline" onClick={() => void list.refetch()}>
            <RefreshCw aria-hidden />
            Tentar novamente
          </Button>
        }
      />
    )
  } else if (allItems.length === 0) {
    content = (
      <EmptyState
        className="rounded-2xl border border-dashed border-line-strong"
        icon={<TaxonomyKindIcon kind={kind} className="size-7" />}
        title={copy.emptyTitle}
        description={copy.emptyDescription}
        action={
          <Button onClick={openCreate}>
            <Plus aria-hidden />
            {copy.newLabel}
          </Button>
        }
      />
    )
  } else if (visible.length === 0) {
    content = (
      <EmptyState
        className="rounded-2xl border border-dashed border-line-strong"
        icon={<SearchX className="size-7" aria-hidden />}
        title={`Nada encontrado para “${query}”`}
        description="Confira a grafia ou tente outro termo — a busca considera nome e descrição."
        action={
          <Button variant="outline" onClick={() => setSearch('')}>
            <X aria-hidden />
            Limpar busca
          </Button>
        }
      />
    )
  } else {
    content = renderList({ items: visible, usage: usageMap, highlightId, onEdit: openEdit, onDelete: openDelete })
  }

  const editing = formState.entity
  const editingUsage = editing ? (usageMap[editing.id] ?? 0) : 0

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <AdminPageHeader
        title={
          <>
            {copy.title}
            {total !== undefined && (
              <span className="ml-3 inline-flex h-7 -translate-y-1 items-center rounded-full bg-surface-2 px-2.5 align-middle font-sans text-sm font-bold tracking-normal text-muted not-italic tabular-nums">
                {total.toLocaleString('pt-BR')}
                <span className="sr-only">&nbsp;{total === 1 ? copy.registered[0] : copy.registered[1]}</span>
              </span>
            )}
          </>
        }
        description={copy.pageDescription}
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden />
            {copy.newLabel}
          </Button>
        }
      />

      {(isLoading || allItems.length > 0) && (
        <TaxonomyToolbar
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          searchLabel={copy.searchLabel}
          searchPlaceholder={copy.searchPlaceholder}
          status={status}
          showStatus={isFiltering}
        />
      )}

      {content}

      <Modal
        open={formState.open}
        onOpenChange={(open) => {
          if (!open && !save.isPending) closeForm()
        }}
        title={editing ? copy.editTitle : copy.newLabel}
        description={
          editing
            ? `${copy.createdLabel} em ${formatDate(editing.createdAt)} · ${pluralize(editingUsage, 'produto vinculado', 'produtos vinculados')}`
            : copy.newDescription
        }
        footer={
          <>
            <Button variant="outline" onClick={closeForm} disabled={save.isPending}>
              Cancelar
            </Button>
            <Button type="submit" form={formId} loading={save.isPending}>
              {editing ? 'Salvar alterações' : copy.createSubmit}
            </Button>
          </>
        }
      >
        <TaxonomyForm
          key={formState.session}
          formId={formId}
          copy={copy}
          entity={editing}
          items={allItems}
          logic={form}
          renderFields={renderFields}
          onSubmit={handleSave}
          submitting={save.isPending}
        />
      </Modal>

      <TaxonomyDeleteDialog
        open={deleteState.open}
        onOpenChange={(open) => setDeleteState((s) => ({ ...s, open }))}
        copy={copy}
        target={deleteTarget}
        count={deleteCount}
        candidates={deleteCandidates}
        usage={usageMap}
        reassignTo={deleteState.reassignTo}
        onReassignChange={(reassignTo) => setDeleteState((s) => ({ ...s, reassignTo }))}
        onConfirm={handleDelete}
        onCreateInstead={() => {
          setDeleteState((s) => ({ ...s, open: false }))
          openCreate()
        }}
      />
    </div>
  )
}
