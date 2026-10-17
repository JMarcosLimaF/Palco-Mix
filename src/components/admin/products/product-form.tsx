import { ArrowUpRight, Check, ChevronLeft, CircleAlert, LoaderCircle, MessageCircle, Save, Trash2 } from 'lucide-react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useBlocker, useLocation, useNavigate, type BlockerFunction } from 'react-router'
import { toast } from 'sonner'
import { AdminPageHeader, Panel, PanelHeader } from '@/components/admin/ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/form'
import {
  useCatalogLookups,
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from '@/hooks/catalog'
import { useMediaQuery } from '@/hooks/use-media-query'
import { expandSizes } from '@/lib/sizes'
import { cn, discountPercent, formatBRL, formatDate, normalizeText, productCode } from '@/lib/utils'
import { errorMessage } from '@/services/errors'
import type { Product, ProductStatus } from '@/types/catalog'
import { ChipsInput } from './chips-input'
import { colorSwatch } from './color-swatches'
import { DeleteProductDialog } from './delete-product-dialog'
import { ImageManager, type ImagesUpdater } from './image-manager'
import { isValidPrice, parsePrice } from './parse-price'
import { PriceInput } from './price-input'
import {
  DESCRIPTION_MAX,
  GENDER_OPTIONS,
  hasErrors,
  NAME_MAX,
  snapshotValues,
  toProductInput,
  topValues,
  VALIDATED_FIELDS,
  validateProductForm,
  valuesFromProduct,
  type ProductFormField,
  type ProductFormValues,
} from './product-form-model'
import { ProductPreview } from './product-preview'
import type { ProductFormLocationState } from './products-params'

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent)
const EASE = [0.16, 1, 0.3, 1] as const

type SaveMode = 'default' | 'another'

export interface ProductFormProps {
  /** null = cadastro */
  product: Product | null
  /** após "Salvar e criar outro": o pai remonta o formulário limpo */
  onCreateAnother: () => void
  /** após excluir (o pai evita exibir "não encontrado" durante a saída) */
  onDeleted: () => void
}

/**
 * Formulário completo de produto (criar/editar): validação inline, prévia ao vivo,
 * imagens, atalho Cmd/Ctrl+S e aviso de alterações não salvas.
 */
export function ProductForm({ product, onCreateAnother, onDeleted }: ProductFormProps) {
  const isEdit = product !== null
  const navigate = useNavigate()
  const location = useLocation()
  const fromList = Boolean((location.state as ProductFormLocationState | null)?.fromList)
  const lookups = useCatalogLookups()
  const catalog = useProducts({ includeInactive: true })
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const reduceMotion = useReducedMotion()
  const formId = useId()
  const fieldId = (field: string) => `${formId}-${field}`

  const [initial] = useState(() => {
    const values = valuesFromProduct(product)
    return { values, snapshot: snapshotValues(values) }
  })
  const [values, setValues] = useState<ProductFormValues>(initial.values)
  const [touched, setTouched] = useState<Partial<Record<ProductFormField, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState<SaveMode | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  // imagens ainda na fila/otimizando no ImageManager
  const [pendingUploads, setPendingUploads] = useState(0)
  const [previewBase] = useState(() => ({
    id: product?.id ?? 'pm-novo',
    createdAt: product?.createdAt ?? new Date().toISOString(),
  }))

  const errors = useMemo(() => validateProductForm(values), [values])
  const isDirty = useMemo(() => snapshotValues(values) !== initial.snapshot, [values, initial.snapshot])
  const uploading = pendingUploads > 0
  // envio em andamento também é alteração: sair agora perde as imagens
  const hasUnsaved = isDirty || uploading
  const visibleError = (field: ProductFormField) => (submitted || touched[field] ? errors[field] : undefined)

  function setField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function touch(field: ProductFormField) {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }))
  }

  const setImages = useCallback<ImagesUpdater>((update) => {
    setValues((v) => ({ ...v, images: update(v.images) }))
  }, [])

  // ------------------------------------------------------------ dados auxiliares
  const allProducts = catalog.data
  const colorSuggestions = useMemo(
    () => topValues((allProducts ?? []).map((p) => p.colors), values.colors),
    [allProducts, values.colors],
  )
  const tagSuggestions = useMemo(
    () => topValues((allProducts ?? []).map((p) => p.tags), values.tags),
    [allProducts, values.tags],
  )
  const duplicateName = useMemo(() => {
    const name = normalizeText(values.name)
    if (name.length < 2 || !allProducts) return null
    return allProducts.find((p) => p.id !== product?.id && normalizeText(p.name) === name) ?? null
  }, [allProducts, values.name, product?.id])

  const priceValue = parsePrice(values.price)
  const promoValue = parsePrice(values.promoPrice)
  const hasDiscount = isValidPrice(priceValue) && isValidPrice(promoValue) && promoValue < priceValue
  const off = hasDiscount ? discountPercent({ price: priceValue, promoPrice: promoValue }) : 0

  // ------------------------------------------------------------ saída / bloqueio
  const dirtyRef = useRef(hasUnsaved)
  const allowLeaveRef = useRef(false)
  useEffect(() => {
    dirtyRef.current = hasUnsaved
  }, [hasUnsaved])

  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      dirtyRef.current && !allowLeaveRef.current && currentLocation.pathname !== nextLocation.pathname,
    [],
  )
  const blocker = useBlocker(shouldBlock)

  // fechar/recarregar a aba com alterações pendentes
  useEffect(() => {
    if (!hasUnsaved) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (allowLeaveRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasUnsaved])

  // depois de salvar/excluir, a lista substitui o formulário no histórico: o Voltar
  // do navegador não reabre um produto excluído nem um cadastro em branco
  const goBack = useCallback(
    (afterWrite = false) => {
      if (fromList) navigate(-1)
      else navigate('/admin/produtos', { replace: afterWrite })
    },
    [fromList, navigate],
  )

  // ------------------------------------------------------------ salvar
  function focusField(field: ProductFormField) {
    const el = document.getElementById(fieldId(field))
    if (!el) return
    el.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' })
    el.focus({ preventScroll: true })
  }

  async function save(mode: SaveMode) {
    if (saving) return
    if (uploading) {
      // salvar agora gravaria o produto sem as imagens que ainda estão na fila
      toast.info('Aguarde o envio das imagens', {
        description: 'Você pode salvar assim que elas terminarem de processar.',
      })
      return
    }
    setSubmitted(true)
    const errs = validateProductForm(values)
    if (hasErrors(errs)) {
      const first = VALIDATED_FIELDS.find((f) => errs[f])
      if (first) focusField(first)
      toast.error('Revise os campos destacados.')
      return
    }
    setSaving(mode)
    try {
      const input = toProductInput(values)
      const saved = product
        ? await updateProduct.mutateAsync({ id: product.id, input })
        : await createProduct.mutateAsync(input)
      allowLeaveRef.current = true
      if (mode === 'another') {
        toast.success('Produto criado', {
          description: `${saved.name} · ${productCode(saved.id)}. Pronto para o próximo.`,
        })
        onCreateAnother()
      } else {
        toast.success(product ? 'Alterações salvas' : 'Produto criado', { description: saved.name })
        goBack(true)
      }
      // sucesso: `saving` fica ligado até o formulário sair da tela. A navegação pode
      // esperar o download da rota da lista, e um 2º toque criaria um produto duplicado.
    } catch (err) {
      toast.error(errorMessage(err))
      setSaving(null)
    }
  }

  // Cmd/Ctrl+S salva (sempre com a versão mais recente de `save`; layout effect
  // garante a versão nova logo após o commit, antes do setTimeout do atalho)
  const saveRef = useRef(save)
  useLayoutEffect(() => {
    saveRef.current = save
  })
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.key.toLowerCase() !== 's') return
      e.preventDefault()
      if (e.repeat) return
      // com um diálogo aberto (biblioteca, confirmação) o atalho não dispara
      if (document.querySelector('[role="dialog"][data-state="open"]')) return
      // tira o foco do campo antes de salvar: aplica o que só entra no blur (ex.: cor ou
      // tag digitada sem Enter no ChipsInput). O save roda depois do re-render.
      const active = document.activeElement
      const field = active instanceof HTMLElement && active !== document.body ? active : null
      field?.blur()
      window.setTimeout(() => {
        void saveRef.current('default').finally(() => {
          // não saiu da tela e a validação não moveu o foco: devolve ao campo
          if (field?.isConnected && document.activeElement === document.body) field.focus({ preventScroll: true })
        })
      })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  async function confirmDelete() {
    if (!product) return
    try {
      await deleteProduct.mutateAsync(product.id)
      allowLeaveRef.current = true
      toast.success('Produto excluído', { description: product.name })
      onDeleted()
      goBack(true)
    } catch (err) {
      toast.error(errorMessage(err))
      throw err
    }
  }

  // ------------------------------------------------------------ render
  const categoryName = values.category ? lookups.categoryById.get(values.category)?.name : undefined
  const distributorName = values.distributor ? lookups.distributorById.get(values.distributor)?.name : undefined

  const preview = (
    <ProductPreview
      values={values}
      base={previewBase}
      categoryName={categoryName}
      distributorName={distributorName}
      collapsible={!isDesktop}
    />
  )

  const publication = (
    <Panel>
      <PanelHeader title="Publicação" description="Visibilidade do produto na loja." />
      <div className="flex flex-col gap-5 p-5">
        <Switch
          checked={values.status === 'active'}
          onCheckedChange={(checked) => setField('status', (checked ? 'active' : 'inactive') satisfies ProductStatus)}
          label="Produto ativo"
          description="Aparece na loja, nas categorias e nas buscas."
        />
        <Switch
          checked={values.isFeatured}
          onCheckedChange={(checked) => setField('isFeatured', checked)}
          label="Destaque no carrossel"
          description="Entra no carrossel principal e na vitrine de destaques."
        />
        <AnimatePresence initial={false}>
          {values.isFeatured && values.status === 'inactive' && (
            <m.p
              key="featured-inactive"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto', transition: { duration: 0.3, ease: EASE } }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.15 } }}
              className="overflow-hidden"
            >
              <span className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
                Produtos inativos não aparecem nos destaques. Ative-o para entrar no carrossel.
              </span>
            </m.p>
          )}
        </AnimatePresence>
      </div>
      {product && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-line px-5 py-4 text-xs">
          <dt className="text-subtle">Código</dt>
          <dd className="text-right font-semibold text-fg tabular-nums">{productCode(product.id)}</dd>
          <dt className="text-subtle">Criado em</dt>
          <dd className="text-right text-muted tabular-nums">{formatDate(product.createdAt)}</dd>
          {product.updatedAt && (
            <>
              <dt className="text-subtle">Atualizado em</dt>
              <dd className="text-right text-muted tabular-nums">{formatDate(product.updatedAt)}</dd>
            </>
          )}
        </dl>
      )}
    </Panel>
  )

  // grid-cols-1 = minmax(0, 1fr): conteúdo com rolagem lateral (sugestões) não alarga a coluna
  const sectionBody = 'grid grid-cols-1 gap-5 p-5 sm:p-6'

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void save('default')
      }}
      className="flex flex-col gap-4 sm:gap-6"
      aria-label={isEdit ? 'Editar produto' : 'Novo produto'}
    >
      <AdminPageHeader
        eyebrow={
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => goBack()}
              className="group -ml-1.5 inline-flex h-11 items-center gap-1 rounded-full pr-3.5 pl-1.5 font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-fg sm:-ml-1 sm:h-8 sm:pr-2.5 sm:pl-1"
            >
              <ChevronLeft className="size-4 transition-transform duration-200 ease-out-expo group-hover:-translate-x-0.5" aria-hidden />
              Produtos
            </button>
            {/* celular: ações do produto como ícones na linha do "voltar" (economiza uma linha inteira) */}
            {product && (
              <div className="-mr-1.5 flex items-center gap-1 sm:hidden">
                <a
                  href={`/produto/${product.id}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Ver na loja (abre em nova aba)"
                  title="Ver na loja"
                  className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'size-11 text-muted hover:text-fg' })}
                >
                  <ArrowUpRight aria-hidden />
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 text-danger-500 hover:bg-red-500/10"
                  onClick={() => setDeleteOpen(true)}
                  aria-label="Excluir produto"
                  title="Excluir"
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            )}
          </div>
        }
        actionsClassName="max-sm:hidden"
        title={isEdit ? 'Editar produto' : 'Novo produto'}
        description={
          product ? (
            <span className="flex items-start gap-2 sm:flex-wrap sm:items-center sm:gap-y-1">
              <Badge tone="outline" className="mt-px shrink-0 tabular-nums sm:mt-0">
                {productCode(product.id)}
              </Badge>
              {/* no celular o nome quebra em até 2 linhas em vez de sumir no "…" */}
              <span className="min-w-0 max-sm:line-clamp-2 sm:truncate">{product.name}</span>
            </span>
          ) : (
            'Cadastre um produto para a vitrine. Campos com * são obrigatórios.'
          )
        }
        actions={
          product ? (
            <>
              <a
                href={`/produto/${product.id}`}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                <ArrowUpRight aria-hidden />
                Ver na loja
              </a>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger-500 hover:bg-red-500/10"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 aria-hidden />
                Excluir
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 lg:items-start">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-6 lg:col-span-2">
          {!isDesktop && preview}

          <Panel>
            <PanelHeader title="Informações" description="Nome e descrição exibidos na página do produto." />
            <div className={sectionBody}>
              <Field
                label="Nome"
                required
                error={visibleError('name')}
                hint={
                  duplicateName ? (
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      Já existe um produto com este nome ({productCode(duplicateName.id)}).
                    </span>
                  ) : undefined
                }
                aside={<Counter value={values.name.length} max={NAME_MAX} />}
              >
                <Input
                  id={fieldId('name')}
                  value={values.name}
                  onChange={(e) => setField('name', e.currentTarget.value)}
                  onBlur={() => touch('name')}
                  maxLength={NAME_MAX}
                  placeholder="Ex.: Sandália Pegada Couro Dupla Tira Velcro"
                  autoComplete="off"
                  autoFocus={!isEdit && isDesktop}
                />
              </Field>
              <Field
                label="Descrição detalhada"
                hint="Materiais, conforto, ocasião de uso… aparece na página do produto."
                aside={<Counter value={values.description.length} max={DESCRIPTION_MAX} />}
              >
                <Textarea
                  id={fieldId('description')}
                  value={values.description}
                  onChange={(e) => setField('description', e.currentTarget.value)}
                  maxLength={DESCRIPTION_MAX}
                  rows={5}
                  placeholder="Ex.: Sandália masculina em couro legítimo com palmilha anatômica e solado antiderrapante."
                  className="min-h-32 resize-y"
                />
              </Field>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Preço"
              description="Com desconto à vista, a loja destaca o preço à vista e mostra o valor a prazo ao lado."
            />
            <div className={sectionBody}>
              <Switch
                checked={values.priceOnRequest}
                onCheckedChange={(checked) => setField('priceOnRequest', checked)}
                label="Preço sob consulta"
                description="A loja mostra “Sob consulta” e o cliente pergunta o valor pelo WhatsApp."
              />
              {values.priceOnRequest ? (
                <p className="animate-fade-in flex items-start gap-2 rounded-xl bg-surface px-3.5 py-3 text-xs leading-relaxed text-muted">
                  <MessageCircle className="mt-px size-4 shrink-0 text-brand-500" aria-hidden />
                  Sem preço na vitrine: o produto fica fora dos filtros por faixa de preço e no fim das ordenações por
                  preço. Desmarque para informar o valor.
                </p>
              ) : (
                <div className="grid animate-fade-in gap-5 sm:grid-cols-2">
                  <Field label="Preço a prazo (normal)" required error={visibleError('price')}>
                    <PriceInput
                      id={fieldId('price')}
                      value={values.price}
                      onValueChange={(v) => setField('price', v)}
                      onBlur={() => touch('price')}
                      placeholder="0,00"
                    />
                  </Field>
                  <Field
                    label="Preço à vista (com desconto)"
                    error={visibleError('promoPrice')}
                    hint="Opcional. Deixe vazio se não houver desconto à vista."
                    aside={
                      <AnimatePresence initial={false}>
                        {off > 0 && (
                          <m.span
                            key="off"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1, transition: { duration: 0.25, ease: EASE } }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                            className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[0.6875rem] font-bold whitespace-nowrap text-brand-600 tabular-nums dark:text-brand-400"
                          >
                            -{off}% à vista
                          </m.span>
                        )}
                      </AnimatePresence>
                    }
                  >
                    <PriceInput
                      id={fieldId('promoPrice')}
                      value={values.promoPrice}
                      onValueChange={(v) => setField('promoPrice', v)}
                      onBlur={() => touch('promoPrice')}
                      placeholder="0,00"
                    />
                  </Field>
                  {hasDiscount && (
                    <p
                      className="animate-fade-in rounded-xl bg-surface px-3.5 py-2.5 text-xs text-muted sm:col-span-2"
                      aria-live="polite"
                    >
                      À vista o cliente paga{' '}
                      <strong className="font-bold text-fg tabular-nums">{formatBRL(promoValue)}</strong> e economiza{' '}
                      <strong className="font-semibold text-fg tabular-nums">{formatBRL(priceValue - promoValue)}</strong>. A
                      prazo, continua <span className="tabular-nums">{formatBRL(priceValue)}</span>.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Organização" description="Onde o produto aparece nos filtros e nas buscas da loja." />
            <div className={cn(sectionBody, 'sm:grid-cols-2')}>
              <Field
                label="Categoria"
                required
                error={visibleError('category')}
                hint={!lookups.isLoading && lookups.categories.length === 0 ? 'Nenhuma categoria cadastrada ainda.' : undefined}
                aside={<ManageLink to="/admin/categorias" label="Gerenciar categorias" />}
              >
                <Select
                  id={fieldId('category')}
                  value={values.category}
                  onChange={(e) => {
                    setField('category', e.currentTarget.value)
                    touch('category')
                  }}
                  onBlur={() => touch('category')}
                  disabled={lookups.isLoading}
                >
                  <option value="" disabled>
                    {lookups.isLoading ? 'Carregando…' : 'Selecione…'}
                  </option>
                  {lookups.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Distribuidor"
                required
                error={visibleError('distributor')}
                hint={
                  !lookups.isLoading && lookups.distributors.length === 0 ? 'Nenhum distribuidor cadastrado ainda.' : undefined
                }
                aside={<ManageLink to="/admin/distribuidores" label="Gerenciar distribuidores" />}
              >
                <Select
                  id={fieldId('distributor')}
                  value={values.distributor}
                  onChange={(e) => {
                    setField('distributor', e.currentTarget.value)
                    touch('distributor')
                  }}
                  onBlur={() => touch('distributor')}
                  disabled={lookups.isLoading}
                >
                  <option value="" disabled>
                    {lookups.isLoading ? 'Carregando…' : 'Selecione…'}
                  </option>
                  {lookups.distributors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Gênero" hint="Opcional.">
                <Select
                  id={fieldId('gender')}
                  value={values.gender}
                  onChange={(e) => setField('gender', e.currentTarget.value as ProductFormValues['gender'])}
                >
                  <option value="">Não informado</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Numeração" hint={<SizesHint sizes={values.sizes} />}>
                <Input
                  id={fieldId('sizes')}
                  value={values.sizes}
                  onChange={(e) => setField('sizes', e.currentTarget.value)}
                  placeholder="Ex.: 34 ao 39"
                  maxLength={40}
                  autoComplete="off"
                />
              </Field>
              <Field label="Cores" aside={<ChipsHelp />} className="sm:col-span-2">
                <ChipsInput
                  id={fieldId('colors')}
                  value={values.colors}
                  onChange={(colors) => setField('colors', colors)}
                  itemLabel="cor"
                  listLabel="Cores adicionadas"
                  placeholder="Ex.: Preto, Off White"
                  suggestions={colorSuggestions}
                  renderPrefix={(color) => <ColorDot color={color} />}
                />
              </Field>
              <Field label="Tags de busca" aside={<ChipsHelp />} className="sm:col-span-2">
                <ChipsInput
                  id={fieldId('tags')}
                  value={values.tags}
                  onChange={(tags) => setField('tags', tags)}
                  itemLabel="tag"
                  listLabel="Tags adicionadas"
                  placeholder="Palavras extras para a busca, ex.: couro, praia"
                  suggestions={tagSuggestions}
                />
              </Field>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Imagens"
              description={
                <>
                  A primeira é a capa do produto.{' '}
                  <span className="pointer-coarse:hidden">Arraste ou use as setas para reordenar.</span>
                  <span className="hidden pointer-coarse:inline">Use as setas para reordenar.</span>
                </>
              }
              actions={
                values.images.length > 0 ? (
                  <Badge tone="neutral" className="tabular-nums">
                    {values.images.length} {values.images.length === 1 ? 'imagem' : 'imagens'}
                  </Badge>
                ) : undefined
              }
            />
            <div className="p-4 sm:p-6">
              <ImageManager
                images={values.images}
                onChange={setImages}
                productName={values.name}
                onPendingChange={setPendingUploads}
              />
            </div>
          </Panel>

          {!isDesktop && publication}
        </div>

        {isDesktop && (
          <aside
            aria-label="Prévia e publicação"
            // -m-3/p-3: espaço para as sombras dos painéis dentro da área rolável;
            // top/max-h descontam a topbar (h-16) e a barra de ações do rodapé
            className="scrollbar-none sticky top-17 -m-3 flex max-h-[calc(100dvh-9.5rem)] flex-col gap-6 overflow-y-auto overscroll-contain p-3"
          >
            {preview}
            {publication}
          </aside>
        )}
      </div>

      {/* barra de ações fixa no rodapé: no celular ocupa a largura toda, colada à borda
          (respeita a barra de gestos); do sm em diante, cartão flutuante */}
      <div className="sticky bottom-0 z-30 -mx-4 mb-[calc(-1*max(1rem,env(safe-area-inset-bottom)))] sm:bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:mx-0 sm:mb-0">
        <div className="flex items-center gap-2 border-t border-line bg-elevated/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_-20px_rgb(13_13_13/0.45)] backdrop-blur-xl sm:gap-3 sm:rounded-2xl sm:border sm:bg-elevated/85 sm:p-2 sm:pl-4 sm:shadow-pop dark:bg-elevated/85 sm:dark:bg-elevated/80">
          {/* status: no cadastro novo o celular não tem espaço (3 botões) */}
          <div
            className={cn('min-w-0 flex-1 items-center gap-2 text-xs', isEdit ? 'flex' : 'hidden sm:flex')}
            aria-live="polite"
          >
            {uploading ? (
              <>
                <LoaderCircle className="size-3.5 shrink-0 animate-spin text-brand-500" aria-hidden />
                <span className="truncate font-semibold text-fg">
                  <span className="sm:hidden">Enviando…</span>
                  <span className="max-sm:hidden">Enviando imagens…</span>
                </span>
              </>
            ) : isDirty ? (
              <>
                <span className="relative flex size-2 shrink-0" aria-hidden>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500/60" />
                  <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
                </span>
                <span className="truncate font-semibold text-fg">
                  <span className="sm:hidden">Não salvo</span>
                  <span className="max-sm:hidden">Alterações não salvas</span>
                </span>
              </>
            ) : (
              <>
                <Check className="size-3.5 shrink-0 text-emerald-500" aria-hidden />
                <span className="truncate text-muted">
                  {isEdit ? (
                    <>
                      <span className="sm:hidden">Sem alterações</span>
                      <span className="max-sm:hidden">Nenhuma alteração</span>
                    </>
                  ) : (
                    'Formulário em branco'
                  )}
                </span>
              </>
            )}
            <kbd className="ml-1 hidden rounded-md border border-line bg-surface px-1.5 py-0.5 font-sans text-[0.6875rem] font-semibold text-subtle md:inline-block">
              {IS_MAC ? '⌘' : 'Ctrl'} S
            </kbd>
          </div>
          <div className={cn('flex items-center gap-2', isEdit ? 'ml-auto' : 'w-full sm:ml-auto sm:w-auto')}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goBack()}
              disabled={saving !== null}
              className="px-3.5 max-sm:h-11 sm:px-4"
            >
              Cancelar
            </Button>
            {!isEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void save('another')}
                loading={saving === 'another'}
                disabled={saving !== null}
                className="px-3.5 max-sm:h-11 sm:px-4"
              >
                <span className="sm:hidden">Salvar + novo</span>
                <span className="hidden sm:inline">Salvar e criar outro</span>
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              loading={saving === 'default'}
              disabled={saving !== null}
              className={cn('px-5 max-sm:h-11', !isEdit && 'max-sm:flex-1')}
            >
              {saving !== 'default' && <Save className={isEdit ? undefined : 'hidden sm:block'} aria-hidden />}
              Salvar
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && !allowLeaveRef.current) blocker.reset?.()
        }}
        title="Descartar alterações?"
        description={
          uploading
            ? 'Ainda há imagens sendo enviadas. Se sair agora, elas e as demais alterações serão perdidas.'
            : 'Você tem alterações não salvas neste produto. Se sair agora, elas serão perdidas.'
        }
        confirmLabel="Descartar e sair"
        cancelLabel="Continuar editando"
        onConfirm={() => {
          allowLeaveRef.current = true
          blocker.proceed?.()
        }}
      />

      {product && (
        <DeleteProductDialog open={deleteOpen} onOpenChange={setDeleteOpen} product={product} onConfirm={confirmDelete} />
      )}
    </form>
  )
}

function Counter({ value, max }: { value: number; max: number }) {
  const near = value >= max * 0.9
  return (
    <span className={cn('text-xs tabular-nums', near ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-subtle')}>
      {value.toLocaleString('pt-BR')}/{max.toLocaleString('pt-BR')}
    </span>
  )
}

function ChipsHelp() {
  return (
    <span className="text-xs text-subtle">
      <kbd className="font-sans font-semibold">Enter</kbd> ou vírgula adiciona
    </span>
  )
}

/**
 * Abre em nova aba para não obrigar a descartar o cadastro em andamento; o que for
 * criado lá aparece aqui sozinho (sincronização entre abas). rel="opener" leva junto
 * a sessão não lembrada (sessionStorage), que uma aba noopener não herdaria.
 */
function ManageLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      target="_blank"
      rel="opener"
      aria-label={`${label} (abre em nova aba)`}
      // celular: área de toque maior sem mexer no alinhamento do rótulo
      className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-600 transition-colors hover:text-brand-500 hover:underline max-sm:-my-3 max-sm:-mr-2 max-sm:py-3 max-sm:pr-2 max-sm:pl-3 dark:text-brand-400"
    >
      Gerenciar
      <ArrowUpRight className="size-3" aria-hidden />
    </Link>
  )
}

function ColorDot({ color }: { color: string }) {
  const swatch = colorSwatch(color)
  if (!swatch) return null
  return (
    <span
      className="size-3 shrink-0 rounded-full ring-1 ring-black/15 dark:ring-white/25"
      style={{ backgroundColor: swatch }}
      aria-hidden
    />
  )
}

/** Mostra como a numeração digitada vira tamanhos na loja. */
function SizesHint({ sizes }: { sizes: string }) {
  const list = expandSizes(sizes)
  if (!sizes.trim()) return <>Faixa de tamanhos, ex.: 34 ao 39 ou 33/34 ao 39/40.</>
  if (!list) return <>Formato livre: aparece como texto na loja.</>
  return (
    <span className="flex flex-wrap items-center gap-1">
      <span className="sr-only">Tamanhos na loja: {list.join(', ')}</span>
      <span className="mr-0.5" aria-hidden>
        Na loja:
      </span>
      {list.map((size) => (
        <span
          key={size}
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-surface-2 px-1 text-[0.6875rem] font-semibold text-fg tabular-nums ring-1 ring-line"
          aria-hidden
        >
          {size}
        </span>
      ))}
    </span>
  )
}
