import { ArrowUpRight, ImagePlus, Pencil, Trash2 } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { memo, useId } from 'react'
import { ProductImage } from '@/components/catalog/product-image'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Skeleton } from '@/components/ui/feedback'
import { cn, formatDate } from '@/lib/utils'
import type { Category } from '@/types/catalog'
import { adminProductsHref, storeHref, taxonomyDomId } from './logic'
import { listItemMotion } from './motion'
import { UsageBadge } from './taxonomy-ui'
import type { TaxonomyListProps } from './types'

// celular: miniatura de 88px ao lado do texto; sm+: capa no topo do card
const COVER_SIZES = '(min-width: 1536px) 26rem, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 88px'

/** Grade de cards de categoria (lista compacta no celular → 2 → 3 colunas). */
export function CategoryGrid({ items, usage, highlightId, onEdit, onDelete }: TaxonomyListProps<Category>) {
  return (
    <ul role="list" className="relative grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {items.map((category, index) => (
          <m.li key={category.id} id={taxonomyDomId('categories', category.id)} className="min-w-0" {...listItemMotion(index)}>
            <CategoryCard
              category={category}
              count={usage[category.id] ?? 0}
              highlighted={highlightId === category.id}
              priority={index < 3}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </m.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

interface CategoryCardProps {
  category: Category
  count: number
  highlighted: boolean
  priority: boolean
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

const CategoryCard = memo(function CategoryCard({ category, count, highlighted, priority, onEdit, onDelete }: CategoryCardProps) {
  const titleId = useId()

  const usageBadge = (tone: 'glass' | 'neutral', className?: string) => (
    <UsageBadge
      count={count}
      tone={tone}
      to={adminProductsHref('categories', category.id)}
      itemName={category.name}
      className={className}
    />
  )

  return (
    // celular: card horizontal compacto (miniatura 5:6 + texto), ~metade da altura do card com capa;
    // sm+: capa 16:10 no topo, como antes
    <article
      aria-labelledby={titleId}
      className={cn(
        'group relative grid h-full grid-cols-[5.5rem_minmax(0,1fr)] overflow-hidden rounded-2xl border border-line bg-elevated shadow-card sm:flex sm:flex-col',
        'transition-[box-shadow,border-color] duration-500 ease-out-expo hover:border-line-strong hover:shadow-card-hover',
        highlighted && 'border-brand-500 ring-4 ring-brand-500/20',
      )}
    >
      <div className="relative m-3 mr-0 aspect-[5/6] self-start overflow-hidden rounded-xl bg-surface-2 ring-1 ring-line sm:m-0 sm:aspect-[16/10] sm:self-auto sm:rounded-none sm:border-b sm:border-line sm:ring-0">
        {category.image ? (
          <ProductImage
            path={category.image}
            alt=""
            sizes={COVER_SIZES}
            priority={priority}
            className="transition-[transform,opacity] duration-700 ease-out-expo group-hover:scale-[1.04]"
          />
        ) : (
          <CoverPlaceholder name={category.name} onAdd={() => onEdit(category)} />
        )}
        <div className="pointer-events-none absolute top-3 left-3 max-sm:hidden">{usageBadge('glass')}</div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3 pl-3.5 sm:p-5 sm:pb-0">
        <h3 id={titleId} className="truncate text-[1.0625rem] leading-6 font-bold tracking-tight text-fg">
          {category.name}
        </h3>
        <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-subtle">
          <span className="max-w-full truncate font-mono" title="Identificador">
            {category.id}
          </span>
          {/* celular: identificador e data em linhas separadas (sem "·" pendurado no fim da linha) */}
          <span aria-hidden className="max-sm:hidden">
            ·
          </span>
          <span className="max-sm:w-full">
            Criada em <time dateTime={category.createdAt}>{formatDate(category.createdAt)}</time>
          </span>
        </p>
        {usageBadge('neutral', 'self-start max-sm:mt-0 sm:hidden')}
        <p
          className={cn(
            'mt-2 line-clamp-2 text-sm leading-5 sm:mt-3 sm:min-h-10',
            category.description ? 'text-muted' : 'text-subtle italic',
          )}
        >
          {category.description || 'Sem descrição'}
        </p>
      </div>

      <div className="col-span-2 mx-3 flex items-center justify-between gap-2 border-t border-line py-1.5 sm:mx-5 sm:mt-4 sm:mb-5 sm:py-0 sm:pt-3">
        <a
          href={storeHref('categories', category.id)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'group/link -ml-2 px-3 text-muted hover:text-fg max-sm:h-10',
          })}
        >
          Ver na loja
          <ArrowUpRight className="transition-transform duration-300 ease-out-expo group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" aria-hidden />
          <span className="sr-only">: {category.name} (abre em nova aba)</span>
        </a>
        <div className="-mr-1.5 flex items-center gap-1.5 sm:mr-0 sm:gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(category)}
            aria-label={`Editar categoria ${category.name}`}
            title="Editar"
            className="text-muted hover:text-fg"
          >
            <Pencil aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(category)}
            aria-label={`Excluir categoria ${category.name}`}
            title="Excluir"
            className="text-muted hover:bg-red-500/10 hover:text-danger-500"
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      </div>
    </article>
  )
})

/** Capa vazia: hachura diagonal (o "movimento" do logo) + atalho para escolher uma imagem. */
function CoverPlaceholder({ name, onAdd }: { name: string; onAdd: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[repeating-linear-gradient(135deg,transparent_0_13px,var(--line)_13px_14px)]">
      <span
        aria-hidden
        className="title-display pointer-events-none absolute -bottom-7 -left-1 text-[9rem] leading-none text-fg/[0.05] select-none max-sm:-bottom-4 max-sm:text-[5.5rem]"
      >
        {name.charAt(0)}
      </span>
      {/* celular (miniatura de 88px): só o ícone */}
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Adicionar capa à categoria ${name}`}
        className="relative inline-flex h-10 items-center gap-2 rounded-full bg-elevated/90 px-4 text-xs font-semibold text-muted shadow-sm ring-1 ring-line backdrop-blur transition-[color,box-shadow] duration-200 hover:text-brand-600 hover:ring-brand-300 max-sm:size-11 max-sm:justify-center max-sm:px-0 dark:hover:text-brand-400 dark:hover:ring-brand-700"
      >
        <ImagePlus className="size-4" aria-hidden />
        <span className="max-sm:sr-only">Adicionar capa</span>
      </button>
    </div>
  )
}

/** Esqueleto com as mesmas proporções dos cards. */
export function CategoryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-hidden className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="grid grid-cols-[5.5rem_minmax(0,1fr)] overflow-hidden rounded-2xl border border-line bg-elevated sm:flex sm:flex-col"
        >
          <Skeleton className="m-3 mr-0 aspect-[5/6] rounded-xl sm:m-0 sm:aspect-[16/10] sm:rounded-none" />
          <div className="flex flex-col gap-2.5 p-3 pl-3.5 sm:p-5">
            <Skeleton className="h-4 w-1/2 rounded-full" />
            <Skeleton className="h-3 w-2/5 rounded-full" />
            <Skeleton className="mt-2 h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-4/5 rounded-full" />
          </div>
          <div className="col-span-2 mx-3 flex items-center justify-between border-t border-line py-1.5 sm:mx-0 sm:px-5 sm:py-3">
            <Skeleton className="h-8 w-24 rounded-full" />
            <div className="flex gap-1.5">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="size-9 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
