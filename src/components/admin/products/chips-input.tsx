import { Plus, X } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn, normalizeText } from '@/lib/utils'

export interface ChipsInputProps {
  value: string[]
  onChange: (next: string[]) => void
  /** nome do item no singular, para rótulos acessíveis ("cor", "tag") */
  itemLabel: string
  /** rótulo acessível da lista de chips ("Cores adicionadas") */
  listLabel: string
  placeholder?: string
  /** sugestões clicáveis exibidas abaixo do campo */
  suggestions?: string[]
  /** elemento antes do texto do chip (ex.: amostra de cor) */
  renderPrefix?: (value: string) => ReactNode
  maxItems?: number
  maxLength?: number
  // repassados pelo <Field>
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  required?: boolean
}

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Campo de "chips": Enter ou vírgula adiciona, × remove,
 * Backspace com o campo vazio remove o último. Colar "a, b, c" adiciona os três.
 */
export function ChipsInput({
  value,
  onChange,
  itemLabel,
  listLabel,
  placeholder,
  suggestions = [],
  renderPrefix,
  maxItems = 20,
  maxLength = 40,
  id,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
}: ChipsInputProps) {
  const [draft, setDraft] = useState('')
  const [flash, setFlash] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const full = value.length >= maxItems

  const keyOf = (s: string) => normalizeText(s)
  const existing = new Map(value.map((v) => [keyOf(v), v]))
  const visibleSuggestions = suggestions.filter((s) => !existing.has(keyOf(s))).slice(0, 8)

  function add(raw: string[]) {
    const next = [...value]
    const seen = new Set(next.map(keyOf))
    let duplicate: string | null = null
    const added: string[] = []
    for (const item of raw) {
      const label = item.trim().replace(/\s+/g, ' ').slice(0, maxLength)
      if (!label) continue
      const key = keyOf(label)
      if (seen.has(key)) {
        duplicate = existing.get(key) ?? label
        continue
      }
      if (next.length >= maxItems) break
      seen.add(key)
      next.push(label)
      added.push(label)
    }
    if (added.length) {
      onChange(next)
      setAnnouncement(`Adicionado: ${added.join(', ')}`)
    }
    if (duplicate) {
      setFlash(duplicate)
      window.setTimeout(() => setFlash((f) => (f === duplicate ? null : f)), 700)
    }
  }

  function remove(item: string) {
    onChange(value.filter((v) => v !== item))
    setAnnouncement(`Removido: ${item}`)
  }

  function handleChange(text: string) {
    if (text.includes(',')) {
      const parts = text.split(',')
      const rest = parts.pop() ?? ''
      add(parts)
      setDraft(rest.trimStart())
      return
    }
    setDraft(text)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      // nunca envia o formulário a partir deste campo
      e.preventDefault()
      if (draft.trim()) {
        add([draft])
        setDraft('')
      }
      return
    }
    if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      e.preventDefault()
      remove(value[value.length - 1])
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) inputRef.current?.focus()
        }}
        className={cn(
          'flex min-h-11 w-full cursor-text flex-wrap items-center gap-1.5 rounded-xl border border-line bg-elevated px-2 py-1.5',
          'transition-[border-color,box-shadow] duration-200 hover:border-line-strong',
          'focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15',
          invalid && 'border-danger-500 focus-within:ring-danger-500/15',
        )}
      >
        <ul className="contents" aria-label={listLabel}>
          <AnimatePresence initial={false}>
            {value.map((item) => (
              <m.li
                key={item}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.25, ease: EASE } }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                className={cn(
                  'inline-flex h-7 max-w-full items-center gap-1.5 rounded-full bg-surface-2 pr-1 pl-2.5 text-xs font-semibold text-fg ring-1 ring-line',
                  'transition-[box-shadow,background-color] duration-300',
                  flash === item && 'bg-brand-500/10 ring-2 ring-brand-500',
                )}
              >
                {renderPrefix?.(item)}
                <span className="truncate">{item}</span>
                <button
                  type="button"
                  onClick={() => {
                    remove(item)
                    inputRef.current?.focus()
                  }}
                  aria-label={`Remover ${itemLabel} ${item}`}
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-subtle transition-colors hover:bg-line hover:text-fg focus-visible:outline-2 focus-visible:outline-brand-500"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={draft}
          disabled={full}
          onChange={(e) => handleChange(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft.trim()) {
              add([draft])
              setDraft('')
            }
          }}
          maxLength={maxLength}
          placeholder={full ? 'Limite atingido' : value.length ? 'Adicionar mais…' : placeholder}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          enterKeyHint="enter"
          className="h-7 min-w-[9ch] flex-1 bg-transparent px-1.5 text-sm text-fg outline-none placeholder:text-subtle disabled:cursor-not-allowed"
        />
      </div>

      {visibleSuggestions.length > 0 && !full && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-xs text-subtle">Sugestões:</span>
          {visibleSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add([s])}
              aria-label={`Adicionar ${itemLabel} ${s}`}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-line-strong px-2.5 text-xs font-medium text-muted transition-colors duration-200 hover:border-brand-500 hover:bg-brand-500/5 hover:text-brand-600 dark:hover:text-brand-400"
            >
              <Plus className="size-3" aria-hidden />
              {renderPrefix?.(s)}
              {s}
            </button>
          ))}
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  )
}
