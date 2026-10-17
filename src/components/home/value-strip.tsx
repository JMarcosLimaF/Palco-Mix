/**
 * Faixa de diferenciais logo abaixo do hero. Só afirmações verificáveis:
 * contatos reais (config/site) e números vindos do próprio catálogo.
 */
import { ArrowUpRight, BadgeCheck, LayoutGrid } from 'lucide-react'
import { useMemo, type ComponentType, type ReactNode } from 'react'
import { Link } from 'react-router'
import { InstagramIcon, WhatsAppIcon } from '@/components/brand/social-icons'
import { site, whatsappLink } from '@/config/site'
import { useDistributors } from '@/hooks/catalog'
import { cn, pluralize } from '@/lib/utils'
import { useActiveCatalogIndex } from './catalog-index'
import { Reveal } from './reveal'

interface ValueItem {
  key: string
  icon: ComponentType<{ className?: string }>
  title: string
  text: ReactNode
  /** rota interna */
  to?: string
  /** link externo (nova aba) */
  href?: string
}

const ITEM_CLASS =
  'group relative flex h-full flex-col gap-3 bg-bg p-4 transition-colors duration-300 hover:bg-surface sm:flex-row sm:items-center sm:gap-4 sm:p-5 ' +
  'focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500'

function ItemBody({ item }: { item: ValueItem }) {
  const Icon = item.icon
  return (
    <>
      <span
        aria-hidden
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 transition-colors duration-300 group-hover:bg-brand-500 group-hover:text-white dark:text-brand-400"
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-fg">{item.title}</span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted">{item.text}</span>
      </span>
      <ArrowUpRight
        aria-hidden
        className="absolute top-4 right-4 size-4 text-subtle opacity-0 transition-[opacity,translate] duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 sm:static sm:shrink-0"
      />
    </>
  )
}

export function ValueStrip() {
  const catalog = useActiveCatalogIndex()
  const distributors = useDistributors()

  const brandsText = useMemo(() => {
    const ranked = (distributors.data ?? [])
      .map((d) => ({ name: d.name, count: catalog.byDistributor.get(d.id)?.length ?? 0 }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count)
    if (ranked.length === 0) return 'Confira as marcas do catálogo'
    const top = ranked.slice(0, 3).map((d) => d.name)
    return ranked.length > 3 ? `${top.join(', ')} e mais` : top.join(', ')
  }, [distributors.data, catalog.byDistributor])

  const items: ValueItem[] = [
    {
      key: 'whatsapp',
      icon: WhatsAppIcon,
      title: 'Peça pelo WhatsApp',
      text: `Atendimento direto no ${site.whatsapp.display}`,
      href: whatsappLink('Olá, Palco Mix! Vim pelo site e quero fazer um pedido.'),
    },
    { key: 'marcas', icon: BadgeCheck, title: 'Marcas que você conhece', text: brandsText, to: '/distribuidores' },
    {
      key: 'catalogo',
      icon: LayoutGrid,
      title: 'Catálogo na palma da mão',
      text: catalog.isLoading
        ? 'Preço e fotos de cada produto'
        : `${pluralize(catalog.total, 'produto', 'produtos')} com fotos e detalhes`,
      to: '/catalogo',
    },
    {
      key: 'instagram',
      icon: InstagramIcon,
      title: 'Siga no Instagram',
      text: `@${site.instagram.handle}`,
      href: site.instagram.url,
    },
  ]

  return (
    <section aria-label="Diferenciais da Palco Mix" className="container-page pt-6 sm:pt-8">
      <Reveal>
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.key} className="min-w-0">
              {item.to ? (
                <Link to={item.to} className={ITEM_CLASS}>
                  <ItemBody item={item} />
                </Link>
              ) : (
                <a href={item.href} target="_blank" rel="noopener noreferrer" className={cn(ITEM_CLASS)}>
                  <ItemBody item={item} />
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              )}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  )
}
