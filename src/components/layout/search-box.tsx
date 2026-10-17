import { LoaderCircle, Search, X } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useId, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import { SearchResults } from './search-results'
import { optionDomId, SEARCH_SHORTCUT_LABEL } from './search-utils'
import { useSearchSuggestionsModel } from './use-search-suggestions-model'

const EASE = [0.16, 1, 0.3, 1] as const

export interface SearchBoxProps {
  /** ref do campo — o cabeçalho usa para os atalhos "/" e Cmd/Ctrl+K */
  inputRef?: RefObject<HTMLInputElement | null>
  className?: string
}

/**
 * Campo de Busca Inteligente (desktop): pesquisa nome, marca, categoria e código,
 * com sugestões ao vivo em um popover acessível (combobox + listbox).
 */
export function SearchBox({ inputRef, className }: SearchBoxProps) {
  const model = useSearchSuggestionsModel()
  const [open, setOpen] = useState(false)
  const ownRef = useRef<HTMLInputElement>(null)
  const fieldRef = inputRef ?? ownRef
  const listboxId = useId()

  // fecha ao navegar (inclusive ao abrir a Visualização Rápida)
  const location = useLocation()
  const [locationKey, setLocationKey] = useState(location.key)
  if (locationKey !== location.key) {
    setLocationKey(location.key)
    setOpen(false)
    model.setActiveKey(null)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      // 1º Esc fecha; 2º limpa; 3º sai do campo
      event.preventDefault()
      if (open) {
        setOpen(false)
        model.setActiveKey(null)
      } else if (model.value) {
        model.setValue('')
      } else {
        event.currentTarget.blur()
      }
      return
    }
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault()
      setOpen(true)
      return
    }
    if (open) model.handleKeyDown(event)
  }

  function clear() {
    model.setValue('')
    setOpen(true)
    fieldRef.current?.focus()
  }

  const activeDescendant = open && model.activeKey ? optionDomId(listboxId, model.activeKey) : undefined

  return (
    <form
      role="search"
      className={cn('relative', className)}
      onSubmit={(event) => {
        event.preventDefault()
        model.submit()
      }}
    >
      <div
        className={cn(
          'group/search relative flex h-10 items-center rounded-full bg-surface-2 ring-1 ring-transparent',
          'transition-[background-color,box-shadow] duration-300 ease-out-expo hover:ring-line-strong',
          'focus-within:bg-elevated focus-within:shadow-[0_0_0_4px_rgb(0_102_255/0.12)] focus-within:ring-brand-500/70 focus-within:hover:ring-brand-500/70',
        )}
      >
        {/* a lupa vira um spinner discreto enquanto digita/consulta */}
        {model.isBusy ? (
          <LoaderCircle className="pointer-events-none absolute left-3 size-4 animate-spin text-brand-500" aria-hidden />
        ) : (
          <Search
            className="pointer-events-none absolute left-3 size-4 text-subtle transition-colors group-focus-within/search:text-brand-500"
            aria-hidden
          />
        )}
        <input
          ref={fieldRef}
          type="search"
          role="combobox"
          aria-label="Buscar produtos por nome, marca, categoria ou código"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant}
          placeholder="Buscar produtos"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          value={model.value}
          onChange={(event) => {
            model.setValue(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false)
            model.setActiveKey(null)
          }}
          onKeyDown={handleKeyDown}
          className="h-full w-full min-w-0 rounded-full bg-transparent pr-10 pl-9 text-sm md:pr-16 lg:pr-10 xl:pr-16 text-fg placeholder:text-subtle focus:outline-none focus-visible:outline-none"
        />
        <span className="absolute right-1.5 flex items-center">
          {model.value ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={clear}
              aria-label="Limpar busca"
              className="inline-flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-line hover:text-fg"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : (
            <kbd
              aria-hidden
              className="pointer-events-none mr-1 hidden h-6 items-center rounded-md border border-line bg-elevated px-1.5 font-sans text-[0.6875rem] font-semibold text-subtle md:inline-flex lg:hidden xl:inline-flex"
            >
              {SEARCH_SHORTCUT_LABEL}
            </kbd>
          )}
        </span>
      </div>

      <AnimatePresence>
        {open && (
          <m.div
            key="search-popover"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.24, ease: EASE } }}
            exit={{ opacity: 0, y: 4, scale: 0.985, transition: { duration: 0.12 } }}
            style={{ transformOrigin: 'top right' }}
            // mantém o foco no campo ao clicar nas sugestões
            onMouseDown={(event) => event.preventDefault()}
            className={cn(
              'absolute top-[calc(100%+0.625rem)] right-0 z-50 flex w-[30rem] max-w-[calc(100vw-2rem)] min-w-full flex-col overflow-hidden',
              'max-h-[min(36rem,calc(100dvh-7rem))] rounded-2xl bg-elevated text-fg shadow-pop ring-1 ring-black/5 dark:ring-white/10',
            )}
          >
            <SearchResults model={model} listboxId={listboxId} variant="popover" />
            <div
              aria-hidden
              className="flex shrink-0 items-center gap-4 border-t border-line px-4 py-2 text-[0.6875rem] text-subtle"
            >
              <span className="inline-flex items-center gap-1">
                <Key>↑</Key>
                <Key>↓</Key>
                navegar
              </span>
              <span className="inline-flex items-center gap-1">
                <Key>↵</Key>
                abrir
              </span>
              <span className="inline-flex items-center gap-1">
                <Key>esc</Key>
                fechar
              </span>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </form>
  )
}

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-surface px-1 font-sans text-[0.625rem] font-semibold text-muted">
      {children}
    </kbd>
  )
}
