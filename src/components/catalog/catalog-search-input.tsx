import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export interface CatalogSearchInputProps {
  /** termo atual da URL (?q=) */
  value: string
  /** chamado com o termo (já sem espaços nas pontas) após 250ms sem digitar, Enter ou limpar */
  onCommit: (term: string) => void
  className?: string
  /** ms de espera após a última tecla */
  delay?: number
}

/**
 * Busca dentro do catálogo. O texto vive aqui (digitar não re-renderiza a
 * página nem a grade); só o termo "assentado" vai para a URL.
 */
export function CatalogSearchInput({ value, onCommit, className, delay = 250 }: CatalogSearchInputProps) {
  const [text, setText] = useState(value)
  // último termo enviado/recebido da URL — distingue o "eco" da nossa própria
  // atualização de uma mudança externa (chip removido, "limpar", voltar)
  const [echo, setEcho] = useState(value)
  if (value !== echo) {
    setEcho(value)
    setText(value)
  }

  useEffect(() => {
    const term = text.trim()
    if (term === echo) return
    const timer = window.setTimeout(() => {
      setEcho(term)
      onCommit(term)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [text, echo, onCommit, delay])

  function commitNow(next: string) {
    const term = next.trim()
    if (term === echo) return
    setEcho(term)
    onCommit(term)
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commitNow(text)
          }
        }}
        placeholder="Buscar no catálogo"
        aria-label="Buscar no catálogo"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        className="h-11 w-full rounded-full border border-line bg-surface pr-10 pl-10 text-sm text-fg placeholder:text-subtle transition-[border-color,box-shadow,background-color] duration-200 hover:border-line-strong focus:border-brand-500 focus:bg-elevated focus:ring-4 focus:ring-brand-500/15 focus:outline-none"
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText('')
            commitNow('')
          }}
          aria-label="Limpar busca"
          className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-subtle transition hover:bg-surface-2 hover:text-fg"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  )
}
