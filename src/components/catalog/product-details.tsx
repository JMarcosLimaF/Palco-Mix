import { ArrowUpRight, Check, Copy, Share2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/brand/social-icons'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { site, whatsappLink } from '@/config/site'
import { useCatalogLookups } from '@/hooks/catalog'
import { catalogHref } from '@/lib/catalog-params'
import { cn, isNewProduct, productCode } from '@/lib/utils'
import type { Product } from '@/types/catalog'
import { colorSwatches, GENDER_LABEL, productWhatsappMessage } from './catalog-helpers'
import { Price } from './price'
import { SizePicker } from './size-picker'

export interface ProductDetailsProps {
  product: Product
  /** modal = Visualização Rápida (links substituem a entrada do histórico e fecham o modal) */
  variant: 'modal' | 'page'
  size: string | null
  onSizeChange: (size: string | null) => void
  /** CTAs (ver `ProductActions`) — omitido quando ficam fixos no rodapé do bottom sheet */
  actions?: ReactNode
  className?: string
}

/** Bloco de detalhes do produto, compartilhado entre a Visualização Rápida e a página do produto. */
export function ProductDetails({ product, variant, size, onSizeChange, actions, className }: ProductDetailsProps) {
  const { categoryById, distributorById } = useCatalogLookups()
  const brand = distributorById.get(product.distributor)?.name
  const category = categoryById.get(product.category)?.name
  const isNew = isNewProduct(product)
  const colors = product.colors?.filter(Boolean) ?? []
  const Heading = variant === 'page' ? 'h1' : 'h2'
  const SubHeading = variant === 'page' ? 'h2' : 'h3'
  const replace = variant === 'modal'

  // ficha técnica (só na página — a Visualização Rápida fica enxuta)
  const facts: Array<{ label: string; value: ReactNode }> = []
  if (variant === 'page') {
    if (brand) facts.push({ label: 'Marca', value: brand })
    if (category) facts.push({ label: 'Categoria', value: category })
    if (product.gender) facts.push({ label: 'Público', value: GENDER_LABEL[product.gender] })
    facts.push({ label: 'Código', value: productCode(product.id) })
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {(brand || category) && (
        <p
          className={cn(
            'eyebrow flex flex-wrap items-center gap-x-1.5 text-brand-600 dark:text-brand-400',
            variant === 'modal' && 'pr-10', // espaço para o botão fechar do modal
          )}
        >
          {brand && (
            <Link
              to={catalogHref({ distributors: [product.distributor] })}
              replace={replace}
              className="rounded-sm transition-colors hover:text-brand-700 dark:hover:text-brand-300"
            >
              {brand}
            </Link>
          )}
          {brand && category && (
            <span className="text-subtle" aria-hidden>
              ·
            </span>
          )}
          {category && (
            <Link
              to={catalogHref({ categories: [product.category] })}
              replace={replace}
              className="rounded-sm text-muted transition-colors hover:text-fg"
            >
              {category}
            </Link>
          )}
        </p>
      )}

      <Heading
        className={cn(
          'mt-2.5 text-balance break-words text-fg',
          variant === 'page' ? 'title-display text-3xl sm:text-4xl xl:text-[2.75rem]' : 'title-display text-2xl sm:text-3xl',
        )}
      >
        {product.name}
      </Heading>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CopyCode id={product.id} />
        {isNew && <Badge tone="brand">Novo</Badge>}
        {product.isFeatured && <Badge tone="dark">Destaque</Badge>}
      </div>

      <Price product={product} size="lg" showDiscount className="mt-5" />

      {(product.sizes || colors.length > 0) && (
        <div className="mt-6 space-y-5 border-t border-line pt-6">
          <SizePicker sizes={product.sizes} value={size} onChange={onSizeChange} />
          {colors.length > 0 && (
            <div>
              <p className="text-sm font-bold text-fg">{colors.length === 1 ? 'Cor' : 'Cores'}</p>
              <ul className="mt-2.5 flex flex-wrap gap-2" aria-label="Cores disponíveis">
                {colors.map((color) => {
                  const swatches = colorSwatches(color)
                  return (
                    <li
                      key={color}
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs font-semibold text-fg"
                    >
                      {swatches.length > 0 && (
                        <span className="flex -space-x-1" aria-hidden>
                          {swatches.map((hex, i) => (
                            <span
                              key={`${hex}-${i}`}
                              className="size-3.5 rounded-full ring-1 ring-black/15 ring-offset-1 ring-offset-surface dark:ring-white/25"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </span>
                      )}
                      {color}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {actions && <div className="mt-7">{actions}</div>}

      {product.description && (
        <div className="mt-8 border-t border-line pt-6">
          <SubHeading className="text-sm font-bold text-fg">Sobre o produto</SubHeading>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted">{product.description}</p>
        </div>
      )}

      {facts.length > 0 && (
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line text-sm">
          {facts.map((fact, i) => (
            <div
              key={fact.label}
              className={cn('bg-elevated px-4 py-3', facts.length % 2 === 1 && i === facts.length - 1 && 'col-span-2')}
            >
              <dt className="eyebrow text-subtle">{fact.label}</dt>
              <dd className="mt-1 font-semibold text-fg">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

/** Código do produto com botão de copiar. */
function CopyCode({ id }: { id: string }) {
  const code = productCode(id)
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success(`Código ${code} copiado`)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Não foi possível copiar o código')
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Código do produto ${code}. Copiar`}
      className="group inline-flex h-6 items-center gap-1.5 rounded-full border border-line px-2.5 text-[0.6875rem] font-semibold text-muted tabular-nums transition-colors duration-200 hover:border-line-strong hover:text-fg"
    >
      Cód. {code}
      {copied ? (
        <Check className="size-3 text-success-500" aria-hidden />
      ) : (
        <Copy className="size-3 opacity-60 transition-opacity group-hover:opacity-100" aria-hidden />
      )}
    </button>
  )
}

export interface ProductActionsProps {
  product: Product
  size: string | null
  /** modal = "Ver página do produto"; page = "Compartilhar" */
  variant: 'modal' | 'page'
  /** bar = rodapé compacto do bottom sheet */
  layout?: 'stack' | 'bar'
  className?: string
}

/** CTA principal (WhatsApp com a numeração escolhida) + ação secundária. */
export function ProductActions({ product, size, variant, layout = 'stack', className }: ProductActionsProps) {
  const href = whatsappLink(productWhatsappMessage(product, size))
  const productPath = `/produto/${product.id}`

  const whatsapp = (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant: 'whatsapp', size: 'lg', className: 'w-full' })}
    >
      <WhatsAppIcon className="size-5" />
      Pedir pelo WhatsApp
    </a>
  )

  if (layout === 'bar') {
    return (
      <div className={cn('flex w-full items-center gap-2', className)}>
        <Link
          to={productPath}
          replace
          aria-label="Ver página do produto"
          title="Ver página do produto"
          className={buttonVariants({ variant: 'outline', size: 'icon', className: 'size-13' })}
        >
          <ArrowUpRight aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">{whatsapp}</div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {whatsapp}
      {variant === 'modal' ? (
        <Link to={productPath} replace className={buttonVariants({ variant: 'outline', size: 'lg', className: 'w-full' })}>
          Ver página do produto
          <ArrowUpRight aria-hidden />
        </Link>
      ) : (
        <ShareButton product={product} />
      )}
      <p className="text-center text-xs text-subtle">
        {size ? `Numeração ${size} incluída na mensagem · ` : 'Atendimento direto com a loja · '}
        <span className="tabular-nums">{site.whatsapp.display}</span>
      </p>
    </div>
  )
}

function ShareButton({ product }: { product: Product }) {
  async function share() {
    const url = `${window.location.origin}/produto/${product.id}`
    const data = { title: `${product.name} · ${site.name}`, text: product.name, url }
    try {
      if (typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(data))) {
        await navigator.share(data)
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success('Link do produto copiado')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      toast.error('Não foi possível compartilhar agora')
    }
  }

  return (
    <button type="button" onClick={share} className={buttonVariants({ variant: 'outline', size: 'lg', className: 'w-full' })}>
      <Share2 aria-hidden />
      Compartilhar
    </button>
  )
}

/** Esqueleto do bloco de detalhes. */
export function ProductDetailsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col', className)} aria-hidden>
      <div className="skeleton h-3 w-32 rounded-full" />
      <div className="skeleton mt-4 h-8 w-11/12 rounded-xl" />
      <div className="skeleton mt-2 h-8 w-2/3 rounded-xl" />
      <div className="skeleton mt-4 h-6 w-28 rounded-full" />
      <div className="skeleton mt-6 h-9 w-40 rounded-xl" />
      <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-11 w-12 rounded-xl" />
        ))}
      </div>
      <div className="skeleton mt-8 h-13 w-full rounded-full" />
      <div className="skeleton mt-3 h-13 w-full rounded-full" />
    </div>
  )
}
