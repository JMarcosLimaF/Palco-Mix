import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

export interface PageHeroStat {
  label: string
  /** undefined = carregando */
  value: number | undefined
}

export interface PageHeroProps {
  /** rótulo da página na trilha de navegação */
  crumb: string
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  stats?: PageHeroStat[]
  className?: string
}

/** Cabeçalho das páginas institucionais (/categorias, /distribuidores). */
export function PageHero({ crumb, eyebrow, title, description, stats, className }: PageHeroProps) {
  return (
    <header className={cn('container-page pt-4 sm:pt-10', className)}>
      <nav aria-label="Trilha de navegação" className="text-xs font-medium text-subtle">
        <ol className="flex items-center gap-1.5">
          <li>
            {/* alvo de toque de ~44px de altura sem empurrar o layout (padding + margem negativa) */}
            <Link to="/" className="-mx-1 -my-3.5 inline-flex rounded-sm px-1 py-3.5 transition-colors hover:text-fg">
              Início
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li aria-current="page" className="text-fg">
            {crumb}
          </li>
        </ol>
      </nav>

      <div className="mt-4 flex flex-col gap-5 border-b border-line pb-6 sm:mt-8 sm:gap-8 sm:pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl min-w-0">
          <p className="eyebrow flex items-center gap-2 text-brand-600 dark:text-brand-400">
            <span aria-hidden className="h-px w-6 bg-current" />
            {eyebrow}
          </p>
          <h1 className="title-display mt-2 text-[2.125rem] text-balance sm:mt-3 sm:text-5xl lg:text-6xl">{title}</h1>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-muted sm:mt-4 sm:text-lg">{description}</p>
          )}
        </div>

        {stats && stats.length > 0 && (
          <dl className="flex shrink-0 gap-8 sm:gap-14">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="eyebrow mt-1 text-subtle sm:mt-1.5">{stat.label}</dt>
                <dd className="title-display text-3xl tabular-nums sm:text-5xl">
                  {stat.value === undefined ? (
                    <span aria-label="Carregando" className="skeleton inline-block h-8 w-12 rounded-lg align-middle sm:h-10 sm:w-14" />
                  ) : (
                    stat.value.toLocaleString('pt-BR')
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </header>
  )
}
