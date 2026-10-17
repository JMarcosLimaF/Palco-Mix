import { ArrowUpRight, Pencil, Trash2 } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { memo, useId } from 'react'
import { tableStyles } from '@/components/admin/table-styles'
import { Panel } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Skeleton } from '@/components/ui/feedback'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn, formatDate } from '@/lib/utils'
import type { Distributor } from '@/types/catalog'
import { adminProductsHref, contactLinks, storeHref, taxonomyDomId, type ContactLink } from './logic'
import { listItemMotion, rowMotion } from './motion'
import { ContactIcon, Monogram, UsageBadge } from './taxonomy-ui'
import type { TaxonomyListProps } from './types'

const DESKTOP_QUERY = '(min-width: 768px)'

/** Tabela no desktop (md+), cards empilhados no celular. */
export function DistributorList(props: TaxonomyListProps<Distributor>) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  return isDesktop ? <DistributorTable {...props} /> : <DistributorCards {...props} />
}

// ------------------------------------------------------------------ tabela (md+)

function DistributorTable({ items, usage, highlightId, onEdit, onDelete }: TaxonomyListProps<Distributor>) {
  return (
    <Panel className="overflow-hidden">
      <div className={tableStyles.wrapper}>
        <table className={tableStyles.table}>
          <caption className="sr-only">Distribuidores cadastrados</caption>
          <thead>
            <tr>
              <th scope="col" className={tableStyles.th}>
                Nome
              </th>
              <th scope="col" className={tableStyles.th}>
                Contato
              </th>
              <th scope="col" className={cn(tableStyles.th, 'text-right')}>
                Produtos
              </th>
              <th scope="col" className={tableStyles.th}>
                Criado em
              </th>
              <th scope="col" className={cn(tableStyles.th, 'text-right')}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {items.map((distributor, index) => (
              <DistributorRow
                key={distributor.id}
                index={index}
                distributor={distributor}
                count={usage[distributor.id] ?? 0}
                highlighted={highlightId === distributor.id}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

interface ItemProps {
  distributor: Distributor
  count: number
  highlighted: boolean
  onEdit: (distributor: Distributor) => void
  onDelete: (distributor: Distributor) => void
}

const DistributorRow = memo(function DistributorRow({
  distributor,
  count,
  highlighted,
  onEdit,
  onDelete,
  index,
}: ItemProps & { index: number }) {
  const contacts = contactLinks(distributor)
  return (
    <m.tr
      id={taxonomyDomId('distributors', distributor.id)}
      {...rowMotion(index)}
      className={cn(tableStyles.tr, 'transition-colors duration-500', highlighted && 'bg-brand-500/[0.07] hover:bg-brand-500/[0.07]')}
    >
      <td className={tableStyles.td}>
        <div className="flex max-w-[22rem] min-w-0 items-center gap-3">
          <Monogram name={distributor.name} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-fg">{distributor.name}</p>
            <p className="truncate text-xs text-subtle">
              <span className="font-mono">{distributor.id}</span>
              {distributor.description ? <span className="text-muted"> · {distributor.description}</span> : null}
            </p>
          </div>
        </div>
      </td>
      <td className={tableStyles.td}>
        {contacts.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {contacts.map((contact) => (
              <li key={contact.type}>
                <ContactAnchor contact={contact} />
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-xs text-subtle">Sem contato</span>
        )}
      </td>
      <td className={cn(tableStyles.td, 'text-right')}>
        <UsageBadge count={count} to={adminProductsHref('distributors', distributor.id)} itemName={distributor.name} />
      </td>
      <td className={cn(tableStyles.td, 'text-sm whitespace-nowrap text-muted')}>
        <time dateTime={distributor.createdAt}>{formatDate(distributor.createdAt)}</time>
      </td>
      <td className={cn(tableStyles.td, 'text-right')}>
        <ItemActions distributor={distributor} onEdit={onEdit} onDelete={onDelete} size="icon-sm" />
      </td>
    </m.tr>
  )
})

function ContactAnchor({ contact }: { contact: ContactLink }) {
  return (
    <a
      href={contact.href}
      aria-label={contact.ariaLabel}
      {...(contact.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="inline-flex max-w-[16rem] items-center gap-1.5 rounded-md text-[0.8125rem] text-muted transition-colors duration-200 hover:text-brand-600 dark:hover:text-brand-400"
    >
      <ContactIcon type={contact.type} className="size-3.5 shrink-0 text-subtle" />
      <span className="truncate">{contact.label}</span>
    </a>
  )
}

function ItemActions({
  distributor,
  onEdit,
  onDelete,
  size,
}: Pick<ItemProps, 'distributor' | 'onEdit' | 'onDelete'> & { size: 'icon' | 'icon-sm' }) {
  return (
    <div className="inline-flex items-center justify-end gap-0.5">
      <a
        href={storeHref('distributors', distributor.id)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Ver produtos de ${distributor.name} na loja (nova aba)`}
        title="Ver na loja"
        className={buttonVariants({ variant: 'ghost', size, className: 'text-muted hover:text-fg' })}
      >
        <ArrowUpRight aria-hidden />
      </a>
      <Button
        variant="ghost"
        size={size}
        onClick={() => onEdit(distributor)}
        aria-label={`Editar distribuidor ${distributor.name}`}
        title="Editar"
        className="text-muted hover:text-fg"
      >
        <Pencil aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size={size}
        onClick={() => onDelete(distributor)}
        aria-label={`Excluir distribuidor ${distributor.name}`}
        title="Excluir"
        className="text-muted hover:bg-red-500/10 hover:text-danger-500"
      >
        <Trash2 aria-hidden />
      </Button>
    </div>
  )
}

// ------------------------------------------------------------------ cards (celular)

function DistributorCards({ items, usage, highlightId, onEdit, onDelete }: TaxonomyListProps<Distributor>) {
  return (
    <ul role="list" className="relative flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {items.map((distributor, index) => (
          <m.li key={distributor.id} id={taxonomyDomId('distributors', distributor.id)} {...listItemMotion(index)}>
            <DistributorCard
              distributor={distributor}
              count={usage[distributor.id] ?? 0}
              highlighted={highlightId === distributor.id}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </m.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

const DistributorCard = memo(function DistributorCard({ distributor, count, highlighted, onEdit, onDelete }: ItemProps) {
  const titleId = useId()
  const contacts = contactLinks(distributor)
  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'rounded-2xl border border-line bg-elevated p-4 shadow-card transition-[box-shadow,border-color] duration-500 ease-out-expo',
        highlighted && 'border-brand-500 ring-4 ring-brand-500/20',
      )}
    >
      <div className="flex items-start gap-3">
        <Monogram name={distributor.name} />
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="truncate text-base leading-6 font-bold tracking-tight text-fg">
            {distributor.name}
          </h3>
          <p className="truncate font-mono text-xs text-subtle">{distributor.id}</p>
        </div>
        <UsageBadge
          count={count}
          to={adminProductsHref('distributors', distributor.id)}
          itemName={distributor.name}
          className="mt-0.5 shrink-0"
        />
      </div>

      {distributor.description ? (
        <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted">{distributor.description}</p>
      ) : null}

      {contacts.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {contacts.map((contact) => (
            <li key={contact.type} className="max-w-full min-w-0">
              <a
                href={contact.href}
                aria-label={contact.ariaLabel}
                {...(contact.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="inline-flex h-10 max-w-full items-center gap-2 rounded-full bg-surface-2 px-3.5 text-xs font-medium text-fg transition-colors duration-200 active:bg-line"
              >
                <ContactIcon type={contact.type} className="size-3.5 shrink-0 text-brand-500" />
                <span className="truncate">{contact.label}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
        <p className="text-xs text-subtle">
          Criado em <time dateTime={distributor.createdAt}>{formatDate(distributor.createdAt)}</time>
        </p>
        <ItemActions distributor={distributor} onEdit={onEdit} onDelete={onDelete} size="icon" />
      </div>
    </article>
  )
})

// ------------------------------------------------------------------ esqueleto

export function DistributorListSkeleton({ count = 5 }: { count?: number }) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const rows = Array.from({ length: count }, (_, i) => i)

  if (!isDesktop) {
    return (
      <div aria-hidden className="flex flex-col gap-3">
        {rows.map((i) => (
          <div key={i} className="rounded-2xl border border-line bg-elevated p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-1/2 rounded-full" />
                <Skeleton className="h-3 w-1/3 rounded-full" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-10 w-36 rounded-full" />
              <Skeleton className="h-10 w-28 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Panel aria-hidden className="overflow-hidden">
      <div className="flex items-center gap-4 border-b border-line bg-surface/95 px-4 py-3.5">
        {['w-16', 'w-20', 'w-16', 'w-20'].map((w, i) => (
          <Skeleton key={i} className={cn('h-2.5 rounded-full', w, i === 0 ? 'mr-auto' : '')} />
        ))}
      </div>
      {rows.map((i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0">
          <Skeleton className="size-10 shrink-0" />
          <div className="flex w-56 flex-col gap-2">
            <Skeleton className="h-3.5 w-3/4 rounded-full" />
            <Skeleton className="h-3 w-1/2 rounded-full" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-40 rounded-full" />
            <Skeleton className="h-3 w-32 rounded-full" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-3 w-24 rounded-full" />
          <div className="flex gap-1">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
      ))}
    </Panel>
  )
}
