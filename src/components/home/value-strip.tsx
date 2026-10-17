/**
 * Faixa de diferenciais logo abaixo do hero. Só afirmações verificáveis:
 * contatos reais (config/site) e números vindos do próprio catálogo.
 * No celular é uma linha compacta com rolagem horizontal (snap); a partir de sm, grade 2×2 / 4 colunas.
 */
import { ArrowUpRight, BadgeCheck, LayoutGrid } from 'lucide-react'
import { useMemo, type ComponentType, type ReactNode } from 'react'
import { Link } from 'react-router'
import { InstagramIcon, WhatsAppIcon } from '@/components/brand/social-icons'
import { site, whatsappLink } from '@/config/site'
import { useDistributors } from '@/hooks/catalog'
import { cn, pluralize } from '@/lib/utils'
import { useActiveCatalogIndex } from './catalog-index'

interface ValueItem {
  key: string
  icon: ComponentType<{ className?: string }>
  title: string
  /** título curto para o celular (cabe em uma linha no cartão do trilho) */
  shortTitle?: string
  text: ReactNode
  /** rota interna */
  to?: string
  /** link externo (nova aba) */
  href?: string
}

// celular: cartão próprio (borda + raio); sm+: célula da grade unida por gap-px
const ITEM_CLASS =
  'group relative flex h-full items-center gap-3 rounded-2xl border border-line bg-elevated p-3 pr-4 transition-colors duration-300 hover:bg-surface ' +
  'sm:gap-4 sm:rounded-none sm:border-0 sm:bg-bg sm:p-5 ' +
  'focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500'

const LIST_CLASS =
  'scrollbar-none -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 ' +
  'sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-px sm:overflow-hidden sm:rounded-3xl sm:border sm:border-line sm:bg-line sm:px-0 lg:grid-cols-4'

function ItemBody({ item }: { item: ValueItem }) {
  const Icon = item.icon
  return (
    <>
      <span
        aria-hidden
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 transition-colors duration-300 group-hover:bg-brand-500 group-hover:text-white sm:size-11 sm:rounded-2xl dark:text-brand-400"
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        {item.shortTitle ? (
          <span className="block text-sm font-bold text-fg">
            <span className="sm:hidden">{item.shortTitle}</span>
            <span className="hidden sm:inline">{item.title}</span>
          </span>
        ) : (
          <span className="block text-sm font-bold text-fg">{item.title}</span>
        )}
        <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted sm:leading-relaxed">{item.text}</span>
      </span>
      <ArrowUpRight
        aria-hidden
        className="hidden size-4 shrink-0 text-subtle opacity-0 transition-[opacity,translate] duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 sm:block"
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
      // o número não quebra no meio ("(81)" sozinho no fim da linha)
      text: (
        <>
          Atendimento direto no <span className="whitespace-nowrap">{site.whatsapp.display}</span>
        </>
      ),
      href: whatsappLink('Olá, Palco Mix! Vim pelo site e quero fazer um pedido.'),
    },
    {
      key: 'marcas',
      icon: BadgeCheck,
      title: 'Marcas que você conhece',
      shortTitle: 'Marcas conhecidas',
      text: brandsText,
      to: '/distribuidores',
    },
    {
      key: 'catalogo',
      icon: LayoutGrid,
      title: 'Catálogo na palma da mão',
      shortTitle: 'Catálogo completo',
      text: catalog.isLoading
        ? 'Fotos e detalhes de cada produto'
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
    // logo abaixo do hero (perto da dobra): sem animação de entrada, já aparece na 1ª tela do celular
    <section aria-label="Diferenciais da Palco Mix" className="container-page pt-4 sm:pt-8">
      <ul className={LIST_CLASS}>
        {items.map((item) => (
          // no celular ~3/4 da largura: o próximo cartão aparece cortado (há mais para o lado)
          <li key={item.key} className="w-[76%] max-w-76 min-w-0 shrink-0 snap-start sm:w-auto sm:max-w-none">
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
    </section>
  )
}
