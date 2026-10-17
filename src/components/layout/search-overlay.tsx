import * as Dialog from '@radix-ui/react-dialog'
import { LoaderCircle, Search, X } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useId, useLayoutEffect, useRef, type RefObject } from 'react'
import { cn } from '@/lib/utils'
import { SearchResults } from './search-results'
import { optionDomId } from './search-utils'
import { useSearchSuggestionsModel } from './use-search-suggestions-model'
import { useVisualViewport } from './use-visual-viewport'

const EASE = [0.16, 1, 0.3, 1] as const

export interface SearchOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Busca em tela cheia (mobile): campo grande com foco automático + as mesmas sugestões do desktop. */
export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  // quem abriu a busca (botão do cabeçalho ou da barra inferior) recebe o foco de volta ao cancelar.
  // O Radix guardaria o próprio campo (o autoFocus acontece antes dele registrar o foco anterior).
  const returnFocusRef = useRef<ReturnFocus | null>(null)
  useLayoutEffect(() => {
    if (!open) return
    const active = document.activeElement
    returnFocusRef.current =
      active instanceof HTMLElement && active !== document.body ? { element: active, href: window.location.href } : null
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* o Overlay do Radix também trava o scroll da página por trás */}
            <Dialog.Overlay asChild forceMount>
              <m.div
                className="fixed inset-0 z-50 bg-bg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.18 } }}
              />
            </Dialog.Overlay>
            <SearchOverlayPanel returnFocusRef={returnFocusRef} />
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

interface ReturnFocus {
  element: HTMLElement
  /** URL na abertura: se mudou (abriu um resultado), o foco vai ao conteúdo, não ao botão */
  href: string
}

/** Painel do diálogo — só existe aberto (o acompanhamento do teclado não roda à toa). */
function SearchOverlayPanel({ returnFocusRef }: { returnFocusRef: RefObject<ReturnFocus | null> }) {
  const viewport = useVisualViewport()
  return (
    <Dialog.Content
      asChild
      forceMount
      onCloseAutoFocus={(event) => {
        const target = returnFocusRef.current
        if (target && target.href !== window.location.href) {
          // abriu um resultado: se nada mais pegou o foco (ex.: só a busca da URL mudou), vai ao conteúdo
          const active = document.activeElement
          if (!active || active === document.body || (event.currentTarget as Node).contains(active)) {
            event.preventDefault()
            document.getElementById('conteudo')?.focus({ preventScroll: true })
          }
          return
        }
        if (!target?.element.isConnected) return
        event.preventDefault()
        target.element.focus({ preventScroll: true })
      }}
    >
      <m.div
        // com o teclado aberto, ocupa só a área visível: campo, sugestões e "ver todos" acima do teclado
        style={viewport ? { top: viewport.offsetTop, height: viewport.height } : undefined}
        className="fixed inset-0 z-50 flex flex-col bg-bg text-fg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } }}
        exit={{ opacity: 0, y: 12, transition: { duration: 0.16 } }}
      >
        <Dialog.Title className="sr-only">Buscar no catálogo</Dialog.Title>
        <Dialog.Description className="sr-only">
          Digite o nome, a marca, a categoria ou o código do produto. Use as setas para percorrer as sugestões.
        </Dialog.Description>
        <SearchOverlayBody />
      </m.div>
    </Dialog.Content>
  )
}

/** Montado só com o overlay aberto: cada abertura começa uma busca nova (busca global). */
function SearchOverlayBody() {
  const model = useSearchSuggestionsModel()
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  // só aponta para opções que existem na lista atual
  const activeDescendant = model.activeOption ? optionDomId(listboxId, model.activeOption.key) : undefined

  return (
    <>
      <div className="shrink-0 border-b border-line px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-4">
        <form
          role="search"
          className="flex items-center gap-1.5"
          onSubmit={(event) => {
            event.preventDefault()
            inputRef.current?.blur()
            model.submit()
          }}
        >
          <div className="relative min-w-0 flex-1">
            {model.isBusy ? (
              <LoaderCircle
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 animate-spin text-brand-500"
                aria-hidden
              />
            ) : (
              <Search
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-brand-500"
                aria-hidden
              />
            )}
            <input
              ref={inputRef}
              // foco imediato ao abrir (o Radix respeita o foco já dentro do diálogo)
              autoFocus
              type="search"
              role="combobox"
              aria-label="Buscar produtos por nome, marca, categoria ou código"
              aria-expanded="true"
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={activeDescendant}
              placeholder="O que você procura?"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="search"
              value={model.value}
              onChange={(event) => model.setValue(event.target.value)}
              onKeyDown={(event) => {
                model.handleKeyDown(event)
              }}
              className={cn(
                'h-12 w-full rounded-full bg-surface-2 pl-12 text-base text-fg ring-1 ring-transparent transition-[box-shadow,background-color] duration-200 placeholder:text-subtle focus:bg-elevated focus:ring-brand-500/60 focus:outline-none focus-visible:outline-none',
                // só reserva espaço para o "limpar" quando há texto (o placeholder cabe inteiro)
                model.value ? 'pr-12' : 'pr-4',
              )}
            />
            {model.value && (
              <span className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center">
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    model.setValue('')
                    inputRef.current?.focus()
                  }}
                  aria-label="Limpar busca"
                  className="inline-flex size-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-line hover:text-fg"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </span>
            )}
          </div>
          <Dialog.Close className="inline-flex h-11 shrink-0 items-center rounded-full px-3 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-500/10 dark:text-brand-400">
            Cancelar
          </Dialog.Close>
        </form>
      </div>
      <div
        className="flex min-h-0 flex-1 flex-col"
        // arrastar a lista fecha o teclado (mais espaço para ver os resultados)
        onTouchMove={() => {
          if (document.activeElement === inputRef.current) inputRef.current?.blur()
        }}
      >
        <SearchResults model={model} listboxId={listboxId} variant="sheet" />
      </div>
    </>
  )
}
