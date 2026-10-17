import { ArrowRight, ArrowUpRight, SearchX, Tags, TrendingUp, Truck } from 'lucide-react'
import { Fragment, useEffect, useId, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ProductImage } from '@/components/catalog/product-image'
import { cn, effectivePrice, formatBRL, hasPromo, pluralize, productCode } from '@/lib/utils'
import { highlightParts, isPlainLeftClick, optionDomId } from './search-utils'
import {
  optionHref,
  type CategoryOption,
  type DistributorOption,
  type ProductOption,
  type SearchOption,
  type SearchSuggestionsModel,
} from './use-search-suggestions-model'

type Variant = 'popover' | 'sheet'

export interface SearchResultsProps {
  model: SearchSuggestionsModel
  /** id do listbox (o campo aponta para ele com aria-controls) */
  listboxId: string
  /** popover = dropdown do cabeçalho; sheet = tela cheia mobile (alvos maiores) */
  variant: Variant
}

/**
 * Lista de sugestões da Busca Inteligente (listbox acessível).
 * O foco permanece no campo; a opção ativa é indicada por aria-activedescendant.
 */
export function SearchResults({ model, listboxId, variant }: SearchResultsProps) {
  const { status, activeKey, query, term } = model
  const sheet = variant === 'sheet'
  const ids = useId()

  // mantém a opção ativa visível ao navegar pelo teclado
  useEffect(() => {
    if (!activeKey) return
    document.getElementById(optionDomId(listboxId, activeKey))?.scrollIntoView({ block: 'nearest' })
  }, [activeKey, listboxId])

  const total = model.all?.total ?? 0
  const announcement =
    status === 'results'
      ? `${pluralize(total, 'produto encontrado', 'produtos encontrados')} para ${term}`
      : status === 'empty'
        ? `Nenhum resultado para ${query}`
        : ''

  return (
    <>
      <div id={listboxId} role="listbox" aria-label="Sugestões de busca" className="flex min-h-0 flex-1 flex-col">
        <div
          role="presentation"
          className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', sheet ? 'px-3 pt-3 pb-6' : 'p-2')}
        >
          {status === 'loading' && <LoadingRows sheet={sheet} />}

          {status === 'empty' && (
            <div role="presentation" className="flex flex-col items-center px-6 pt-6 pb-4 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-surface-2 text-subtle">
                <SearchX className="size-5" aria-hidden />
              </span>
              <p className="mt-3 max-w-full text-sm font-semibold break-words text-fg">
                Nada encontrado para “{query}”
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">
                Confira a grafia ou busque pela marca, pela categoria ou pelo código do produto (ex.: PM-0001).
              </p>
            </div>
          )}

          {(status === 'idle' || status === 'empty') && model.popular.length > 0 && (
            <Group
              id={`${ids}-popular`}
              label={status === 'idle' ? 'Buscas populares' : 'Experimente'}
              icon={<TrendingUp className="size-3.5" aria-hidden />}
            >
              <div role="presentation" className={cn('flex flex-wrap gap-2 px-2 pb-2', sheet && 'gap-2.5')}>
                {model.popular.map((option) => (
                  <OptionLink
                    key={option.key}
                    model={model}
                    listboxId={listboxId}
                    option={option}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border border-line bg-elevated font-semibold text-fg',
                      'transition-colors duration-200 hover:border-line-strong',
                      'aria-selected:border-brand-500 aria-selected:bg-brand-500/10 aria-selected:text-brand-700 dark:aria-selected:text-brand-300',
                      sheet ? 'h-10 px-4 text-sm' : 'h-9 px-3.5 text-[0.8125rem]',
                    )}
                  >
                    {option.kind === 'category' ? (
                      <Tags className="size-3.5 text-subtle" aria-hidden />
                    ) : (
                      <Truck className="size-3.5 text-subtle" aria-hidden />
                    )}
                    {option.kind === 'category' ? option.category.name : option.distributor.name}
                  </OptionLink>
                ))}
              </div>
            </Group>
          )}

          {status === 'results' && (
            <>
              {model.products.length > 0 && (
                <Group id={`${ids}-products`} label="Produtos">
                  {model.products.map((option) => (
                    <ProductRow key={option.key} model={model} listboxId={listboxId} option={option} sheet={sheet} />
                  ))}
                </Group>
              )}
              {model.categories.length > 0 && (
                <Group id={`${ids}-categories`} label="Categorias">
                  {model.categories.map((option) => (
                    <TaxonomyRow key={option.key} model={model} listboxId={listboxId} option={option} sheet={sheet} />
                  ))}
                </Group>
              )}
              {model.distributors.length > 0 && (
                <Group id={`${ids}-distributors`} label="Distribuidores">
                  {model.distributors.map((option) => (
                    <TaxonomyRow key={option.key} model={model} listboxId={listboxId} option={option} sheet={sheet} />
                  ))}
                </Group>
              )}
            </>
          )}
        </div>

        {model.all && (
          <OptionLink
            model={model}
            listboxId={listboxId}
            option={model.all}
            className={cn(
              'group flex shrink-0 items-center justify-between gap-3 border-t border-line bg-surface/70 text-sm font-semibold text-fg',
              'transition-colors duration-150 hover:bg-surface-2 aria-selected:bg-surface-2',
              sheet ? 'px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]' : 'px-4 py-3',
            )}
          >
            <span className="min-w-0 truncate">
              {model.all.total > 0 ? (
                <>
                  Ver {model.all.total === 1 ? 'o' : 'todos os'}{' '}
                  <span className="text-brand-600 tabular-nums dark:text-brand-400">{model.all.total}</span>{' '}
                  {model.all.total === 1 ? 'resultado' : 'resultados'} para “{model.all.term}”
                </>
              ) : (
                <>Buscar “{model.all.term}” no catálogo</>
              )}
            </span>
            <ArrowRight
              className="size-4 shrink-0 text-subtle transition-transform duration-200 ease-out-expo group-hover:translate-x-0.5 group-aria-selected:translate-x-0.5 group-aria-selected:text-brand-500"
              aria-hidden
            />
          </OptionLink>
        )}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </>
  )
}

// ---------------------------------------------------------------- partes

function Group({ id, label, icon, children }: { id: string; label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div role="group" aria-labelledby={id} className="pb-1">
      <div id={id} className="eyebrow flex items-center gap-1.5 px-2 pt-2.5 pb-2 text-subtle">
        {icon}
        {label}
      </div>
      {children}
    </div>
  )
}

interface OptionLinkProps {
  model: SearchSuggestionsModel
  listboxId: string
  option: SearchOption
  className?: string
  children: ReactNode
}

/** Opção do listbox: link real (Ctrl/Cmd+clique abre em nova aba), sem foco próprio. */
function OptionLink({ model, listboxId, option, className, children }: OptionLinkProps) {
  const selected = model.activeKey === option.key
  return (
    <Link
      id={optionDomId(listboxId, option.key)}
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      to={optionHref(option)}
      draggable={false}
      onPointerMove={() => {
        if (!selected) model.setActiveKey(option.key)
      }}
      onClick={(event) => {
        if (!isPlainLeftClick(event)) return
        event.preventDefault()
        model.activate(option)
      }}
      className={cn('scroll-my-2 outline-none select-none', className)}
    >
      {children}
    </Link>
  )
}

function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((part, i) =>
        part.match ? (
          <mark
            key={i}
            className="rounded-[0.2em] bg-brand-500/12 box-decoration-clone text-brand-700 dark:bg-brand-400/20 dark:text-brand-200"
          >
            {part.text}
          </mark>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </>
  )
}

interface RowProps<T extends SearchOption> {
  model: SearchSuggestionsModel
  listboxId: string
  option: T
  sheet: boolean
}

function ProductRow({ model, listboxId, option, sheet }: RowProps<ProductOption>) {
  const { product, distributorName, categoryName } = option
  const promo = hasPromo(product)
  return (
    <OptionLink
      model={model}
      listboxId={listboxId}
      option={option}
      className={cn(
        'group flex items-center gap-3 rounded-xl transition-colors duration-150 aria-selected:bg-surface-2',
        sheet ? 'px-2 py-2' : 'px-2 py-1.5',
      )}
    >
      <span
        className={cn(
          'relative aspect-[5/6] shrink-0 overflow-hidden rounded-lg bg-surface-2 ring-1 ring-black/[0.05] dark:ring-white/[0.08]',
          sheet ? 'w-12' : 'w-10',
        )}
      >
        <ProductImage path={product.images[0]} alt="" sizes={sheet ? '48px' : '40px'} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-fg">
          <Highlight text={product.name} query={model.term} />
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted">
          {distributorName}
          <span className="text-subtle"> · </span>
          {categoryName}
          <span className="text-subtle"> · </span>
          <span className="tabular-nums">
            <Highlight text={productCode(product.id)} query={model.term} />
          </span>
        </span>
      </span>
      <span className="shrink-0 text-right leading-tight">
        <span className="block text-sm font-bold text-fg tabular-nums">
          <span className="sr-only">{promo ? 'Preço promocional: ' : 'Preço: '}</span>
          {formatBRL(effectivePrice(product))}
        </span>
        {promo && (
          <span className="block text-[0.6875rem] text-subtle tabular-nums line-through">
            <span className="sr-only">Preço original: </span>
            {formatBRL(product.price)}
          </span>
        )}
      </span>
    </OptionLink>
  )
}

function TaxonomyRow({ model, listboxId, option, sheet }: RowProps<CategoryOption | DistributorOption>) {
  const isCategory = option.kind === 'category'
  const name = isCategory ? option.category.name : option.distributor.name
  const Icon = isCategory ? Tags : Truck
  return (
    <OptionLink
      model={model}
      listboxId={listboxId}
      option={option}
      className={cn(
        'group flex items-center gap-3 rounded-xl transition-colors duration-150 aria-selected:bg-surface-2',
        sheet ? 'px-2 py-2' : 'px-2 py-1.5',
      )}
    >
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted transition-colors duration-150',
          'group-aria-selected:bg-brand-500 group-aria-selected:text-white',
          sheet ? 'size-12' : 'size-10',
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-fg">
          <Highlight text={name} query={model.term} />
        </span>
        <span className="mt-0.5 block text-xs text-muted tabular-nums">
          {isCategory ? 'Categoria' : 'Distribuidor'} · {pluralize(option.count, 'produto', 'produtos')}
        </span>
      </span>
      <ArrowUpRight
        className="size-4 shrink-0 text-subtle opacity-0 transition-[opacity,transform] duration-200 ease-out-expo group-hover:opacity-100 group-aria-selected:translate-x-0.5 group-aria-selected:-translate-y-0.5 group-aria-selected:opacity-100"
        aria-hidden
      />
    </OptionLink>
  )
}

function LoadingRows({ sheet }: { sheet: boolean }) {
  return (
    <div aria-hidden className="space-y-1 pt-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-1.5">
          <div className={cn('skeleton aspect-[5/6] shrink-0 rounded-lg', sheet ? 'w-12' : 'w-10')} />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-3/4 rounded-full" />
            <div className="skeleton h-2.5 w-1/3 rounded-full" />
          </div>
          <div className="skeleton h-3 w-14 rounded-full" />
        </div>
      ))}
    </div>
  )
}
