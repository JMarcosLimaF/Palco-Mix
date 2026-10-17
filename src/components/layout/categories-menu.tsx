import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { Link, useLocation } from 'react-router'
import { LogoMark } from '@/components/brand/logo'
import { catalogHref } from '@/lib/catalog-params'
import { cn, pluralize } from '@/lib/utils'
import { NavActivePill } from './nav-active-pill'
import { HEADER_NAV_ITEM } from './nav-config'
import { useNavTaxonomy } from './use-nav-taxonomy'

const EASE = [0.16, 1, 0.3, 1] as const
const OPEN_DELAY = 120
const CLOSE_DELAY = 200

type FocusTarget = 'first' | 'last'

function menuItems(panel: HTMLElement | null): HTMLElement[] {
  return panel ? Array.from(panel.querySelectorAll<HTMLElement>('[data-menu-item]')) : []
}

function focusItem(panel: HTMLElement | null, target: FocusTarget) {
  const items = menuItems(panel)
  ;(target === 'first' ? items[0] : items.at(-1))?.focus()
}

/**
 * "Categorias" do cabeçalho: painel com as categorias + contagem de produtos ativos.
 * Abre por clique ou passando o mouse (com atraso); fecha com Esc, clique fora,
 * saída do foco ou navegação. ↓/↑ no botão entram no painel; ↑ ↓ Home End navegam.
 */
export function CategoriesMenu({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | undefined>(undefined)
  /** aberto pelo hover (fecha ao sair); clique "fixa" o painel */
  const hoverModeRef = useRef(false)
  const pendingFocusRef = useRef<FocusTarget | null>(null)

  // fecha ao navegar
  const location = useLocation()
  const [locationKey, setLocationKey] = useState(location.key)
  if (locationKey !== location.key) {
    setLocationKey(location.key)
    setOpen(false)
  }

  function clearTimer() {
    window.clearTimeout(timerRef.current)
  }

  function show(byHover: boolean, focus: FocusTarget | null = null) {
    clearTimer()
    hoverModeRef.current = byHover
    pendingFocusRef.current = focus
    setOpen(true)
  }

  function hide(returnFocus = false) {
    clearTimer()
    hoverModeRef.current = false
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  // clique fora fecha
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: globalThis.PointerEvent) {
      if (wrapperRef.current?.contains(event.target as Node)) return
      clearTimeout(timerRef.current)
      hoverModeRef.current = false
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, { passive: true })
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // foco pedido pelo teclado ao abrir (↓ / ↑ no botão)
  useEffect(() => {
    if (!open || !pendingFocusRef.current) return
    focusItem(panelRef.current, pendingFocusRef.current)
    pendingFocusRef.current = null
  }, [open])

  // limpa o timer pendente ao desmontar
  useEffect(() => {
    const timer = timerRef
    return () => window.clearTimeout(timer.current)
  }, [])

  function onPointerEnter(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return
    clearTimer()
    if (!open) timerRef.current = window.setTimeout(() => show(true), OPEN_DELAY)
  }

  function onPointerLeave(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return
    clearTimer()
    if (open && hoverModeRef.current) timerRef.current = window.setTimeout(() => hide(), CLOSE_DELAY)
  }

  function onTriggerClick() {
    if (open && hoverModeRef.current) {
      // já aberto pelo hover: o clique só fixa o painel
      hoverModeRef.current = false
      clearTimer()
      return
    }
    if (open) hide()
    else show(false)
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const target: FocusTarget = event.key === 'ArrowDown' ? 'first' : 'last'
      if (open) focusItem(panelRef.current, target)
      else show(false, target)
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      hide()
    }
  }

  function onPanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = menuItems(panelRef.current)
    if (items.length === 0) return
    const index = items.indexOf(document.activeElement as HTMLElement)
    let next: HTMLElement | undefined
    switch (event.key) {
      case 'ArrowDown':
        next = items[index < 0 ? 0 : (index + 1) % items.length]
        break
      case 'ArrowUp':
        next = items[index <= 0 ? items.length - 1 : index - 1]
        break
      case 'Home':
        next = items[0]
        break
      case 'End':
        next = items.at(-1)
        break
      case 'Escape':
        event.preventDefault()
        hide(true)
        return
      default:
        return
    }
    event.preventDefault()
    next?.focus()
  }

  function onBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget
    if (open && next instanceof Node && !event.currentTarget.contains(next)) hide()
  }

  return (
    <div ref={wrapperRef} className="relative" onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={onTriggerClick}
        onKeyDown={onTriggerKeyDown}
        className={cn(HEADER_NAV_ITEM, active || open ? 'text-fg' : 'text-muted hover:text-fg')}
      >
        {active && <NavActivePill />}
        Categorias
        <ChevronDown
          className={cn('size-3.5 transition-transform duration-300 ease-out-expo', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            key="categories-panel"
            ref={panelRef}
            id={panelId}
            initial={{ opacity: 0, y: -6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.26, ease: EASE } }}
            exit={{ opacity: 0, y: -4, scale: 0.985, transition: { duration: 0.14 } }}
            style={{ transformOrigin: '6rem 0' }}
            onKeyDown={onPanelKeyDown}
            // pt-3 = "ponte" invisível entre o botão e o painel (o hover não se perde)
            className="absolute top-full -left-4 z-50 pt-3"
          >
            <CategoriesPanel />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Conteúdo do painel (só monta com o menu aberto). */
function CategoriesPanel() {
  const { categories, distributors, totalProducts, isLoading } = useNavTaxonomy()
  // ordem por coluna: ↓ percorre a 1ª coluna e depois a 2ª
  const rows = Math.max(1, Math.ceil(categories.length / 2))

  return (
    <div className="grid w-[40rem] grid-cols-[minmax(0,1fr)_14.5rem] gap-2 rounded-3xl bg-elevated p-2 text-fg shadow-pop ring-1 ring-black/5 dark:ring-white/10">
      <div className="flex flex-col p-3">
        <div className="flex items-baseline justify-between gap-3 px-3 pb-3">
          <p className="eyebrow text-subtle">Compre por categoria</p>
          {!isLoading && (
            <p className="text-xs text-subtle tabular-nums">{pluralize(categories.length, 'categoria', 'categorias')}</p>
          )}
        </div>

        {isLoading ? (
          <div aria-hidden className="grid grid-cols-2 gap-1">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex h-11 items-center px-3">
                <div className="skeleton h-3 w-2/3 rounded-full" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted">Nenhuma categoria com produtos no momento.</p>
        ) : (
          <ul
            className="grid grid-flow-col grid-cols-2 gap-x-1 gap-y-0.5"
            style={{ gridTemplateRows: `repeat(${rows}, minmax(0, auto))` }}
          >
            {categories.map(({ item, count }) => (
              <li key={item.id} className="min-w-0">
                <Link
                  data-menu-item
                  to={catalogHref({ categories: [item.id] })}
                  className="group flex h-11 items-center justify-between gap-3 rounded-xl px-3 text-sm font-semibold text-fg transition-colors duration-200 hover:bg-surface-2 focus-visible:bg-surface-2"
                >
                  <span className="truncate">{item.name}</span>
                  <span
                    aria-hidden
                    className="inline-flex h-5 min-w-7 items-center justify-center rounded-full bg-surface-2 px-1.5 text-[0.6875rem] font-bold text-subtle tabular-nums transition-colors duration-200 group-hover:bg-brand-500 group-hover:text-white group-focus-visible:bg-brand-500 group-focus-visible:text-white"
                  >
                    {count}
                  </span>
                  <span className="sr-only">, {pluralize(count, 'produto', 'produtos')}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto px-3 pt-4">
          <div className="border-t border-line pt-3">
            <Link
              data-menu-item
              to="/categorias"
              className="group inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-brand-600 dark:text-brand-400"
            >
              Ver todas as categorias
              <ArrowRight className="size-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      <Link
        data-menu-item
        to="/catalogo"
        className="group relative isolate flex min-h-[15rem] flex-col justify-between overflow-hidden rounded-2xl bg-ink-950 p-5 text-white dark:ring-1 dark:ring-white/10"
      >
        <span
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(120%_70%_at_100%_0%,rgb(0_102_255/0.5),transparent_62%)] transition-opacity duration-500 group-hover:opacity-80"
        />
        <LogoMark className="absolute -right-8 -bottom-6 -z-10 h-36 text-white opacity-[0.07] transition-transform duration-700 ease-out-expo group-hover:translate-x-1 group-hover:-translate-y-1" />
        <span className="eyebrow text-brand-300">Catálogo completo</span>
        <span>
          <span className="title-display block text-5xl tabular-nums">{isLoading ? '—' : totalProducts}</span>
          <span className="mt-1.5 block text-sm leading-snug text-white/70">
            {totalProducts === 1 ? 'produto' : 'produtos'} de {pluralize(distributors.length, 'marca', 'marcas')} em um só lugar
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
          Explorar tudo
          <ArrowUpRight
            className="size-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </span>
      </Link>
    </div>
  )
}
