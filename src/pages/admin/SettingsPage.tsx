/**
 * /admin/configuracoes — aparência, dados do catálogo (backup/restauração),
 * teste de desempenho e aviso sobre a autenticação de demonstração.
 */
import { useQuery } from '@tanstack/react-query'
import {
  ArrowUpRight,
  Database,
  Download,
  FlaskConical,
  Gauge,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  ShieldAlert,
  Sun,
  Trash2,
  TriangleAlert,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'
import { useId, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { formatCount } from '@/components/admin/dashboard/dashboard-utils'
import { AdminPageHeader, Panel } from '@/components/admin/ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/feedback'
import { useCategories, useDistributors, useProducts } from '@/hooks/catalog'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn, pluralize } from '@/lib/utils'
import { adminService, STRESS_ID_PREFIX } from '@/services/admin'
import { errorMessage } from '@/services/errors'
import { useAuthStore } from '@/store/auth'
import { useThemeStore, type ThemeMode } from '@/store/theme'

const EASE = [0.16, 1, 0.3, 1] as const
/** Limite típico do localStorage nos navegadores. */
const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024
/** Arquivos maiores que isso não caberiam no armazenamento local de qualquer forma. */
const MAX_IMPORT_BYTES = 25 * 1024 * 1024

export default function SettingsPage() {
  useDocumentTitle('Configurações · Admin')

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <AdminPageHeader
        title="Configurações"
        description="Aparência do painel, backup do catálogo e ferramentas para testar o desempenho da loja."
      />
      <div className="flex max-w-4xl flex-col gap-5 sm:gap-6">
        <AppearanceSection />
        <CatalogDataSection />
        <PerformanceSection />
        <AccessSection />
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ estrutura

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
  index,
}: {
  icon: LucideIcon
  title: string
  description: ReactNode
  children: ReactNode
  index: number
}) {
  const headingId = useId()
  return (
    <m.section
      aria-labelledby={headingId}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: EASE }}
    >
      <Panel className="overflow-hidden">
        <header className="flex items-start gap-3.5 border-b border-line px-5 py-4 sm:px-6">
          <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <Icon className="size-[1.1rem]" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id={headingId} className="text-base font-bold tracking-tight text-fg">
              {title}
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
          </div>
        </header>
        <div className="divide-y divide-line">{children}</div>
      </Panel>
    </m.section>
  )
}

function SettingRow({
  title,
  description,
  children,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6',
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description && <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-muted">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

// ------------------------------------------------------------------ (a) aparência

const THEME_OPTIONS: ReadonlyArray<{ value: ThemeMode; label: string; icon: LucideIcon }> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

function AppearanceSection() {
  const mode = useThemeStore((s) => s.mode)
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const labelId = useId()

  const description =
    mode === 'system'
      ? `Acompanha o tema do seu dispositivo — agora está ${systemDark ? 'escuro' : 'claro'}.`
      : 'Vale para a loja e para o painel neste navegador.'

  return (
    <SettingsSection index={0} icon={Palette} title="Aparência" description="Escolha como o site aparece para você.">
      <SettingRow title={<span id={labelId}>Tema</span>} description={description}>
        <ThemeSegmentedControl labelledBy={labelId} />
      </SettingRow>
    </SettingsSection>
  )
}

/** Controle segmentado acessível (radiogroup com setas ← →). */
function ThemeSegmentedControl({ labelledBy }: { labelledBy: string }) {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const buttons = useRef<Array<HTMLButtonElement | null>>([])

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = THEME_OPTIONS.length - 1
    let next: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index === last ? 0 : index + 1
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index === 0 ? last : index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    if (next === null) return
    event.preventDefault()
    setMode(THEME_OPTIONS[next].value)
    buttons.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="grid w-full grid-cols-3 rounded-full bg-surface-2 p-1 ring-1 ring-line ring-inset sm:inline-flex sm:w-auto"
    >
      {THEME_OPTIONS.map((option, index) => {
        const checked = mode === option.value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttons.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => setMode(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'relative inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-semibold sm:px-3.5',
              'transition-colors duration-200 ease-out-expo',
              checked ? 'text-fg' : 'text-muted hover:text-fg',
            )}
          >
            {checked && (
              <m.span
                layoutId="settings-theme-pill"
                aria-hidden
                className="absolute inset-0 rounded-full bg-elevated shadow-[0_1px_2px_rgb(13_13_13/0.08),0_4px_12px_-4px_rgb(13_13_13/0.18)] ring-1 ring-line"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }}
              />
            )}
            <Icon className={cn('relative size-4', checked && 'text-brand-500')} aria-hidden />
            <span className="relative">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ------------------------------------------------------------------ (b) dados do catálogo

/** Uso do armazenamento — chave sob 'catalog' para ser revalidada a cada escrita no banco. */
function useStorageInfo() {
  return useQuery({
    queryKey: ['catalog', 'admin', 'storage-info'],
    queryFn: () => adminService.storageInfo(),
    staleTime: 0,
  })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${formatCount(bytes)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} KB`
  return `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} MB`
}

/** "2026-10-17" no fuso local. */
function dateStamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Baixa o banco atual como JSON. */
function downloadBackup() {
  try {
    const json = adminService.exportJson()
    const filename = `palcomix-catalogo-${dateStamp()}.json`
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success('Backup exportado', { description: filename })
  } catch (err) {
    toast.error(errorMessage(err, 'Não foi possível exportar o backup.'))
  }
}

interface ImportCandidate {
  fileName: string
  size: number
  text: string
  counts: { products: number; categories: number; distributors: number }
}

/** Lê o resumo de um backup sem tocar no banco (a validação completa fica no serviço). */
function summarizeBackup(value: unknown): ImportCandidate['counts'] | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (!Array.isArray(v.products) || !Array.isArray(v.categories) || !Array.isArray(v.distributors)) return null
  return { products: v.products.length, categories: v.categories.length, distributors: v.distributors.length }
}

function CatalogDataSection() {
  const storage = useStorageInfo()
  const products = useProducts({ includeInactive: true })
  const categories = useCategories()
  const distributors = useDistributors()
  const fileInput = useRef<HTMLInputElement>(null)
  const [candidate, setCandidate] = useState<ImportCandidate | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const reduceMotion = useReducedMotion()
  const bytes = storage.data?.bytes ?? 0
  const pristine = storage.data?.pristine ?? true
  const ratio = Math.min(1, bytes / STORAGE_LIMIT_BYTES)
  const pct = Math.round(ratio * 1000) / 10
  const meterTone = ratio >= 0.85 ? 'bg-danger-500' : ratio >= 0.6 ? 'bg-warning-500' : 'bg-brand-gradient'

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // permite escolher o mesmo arquivo de novo
    if (!file) return
    if (file.size > MAX_IMPORT_BYTES) {
      toast.error('Arquivo grande demais para o armazenamento local do navegador.')
      return
    }
    let text: string
    let parsed: unknown
    try {
      text = await file.text()
      parsed = JSON.parse(text)
    } catch {
      toast.error('O arquivo não é um JSON válido.')
      return
    }
    const counts = summarizeBackup(parsed)
    if (!counts) {
      toast.error('Arquivo inválido: estrutura do banco não reconhecida.')
      return
    }
    setCandidate({ fileName: file.name, size: file.size, text, counts })
    setImportOpen(true)
  }

  async function confirmImport() {
    if (!candidate) return
    try {
      const data = await adminService.importJson(candidate.text)
      toast.success('Backup importado', {
        description: `${pluralize(data.products.length, 'produto', 'produtos')}, ${pluralize(data.categories.length, 'categoria', 'categorias')} e ${pluralize(data.distributors.length, 'distribuidor', 'distribuidores')}.`,
      })
    } catch (err) {
      toast.error(errorMessage(err, 'Não foi possível importar o backup.'))
    }
  }

  async function confirmReset() {
    try {
      await adminService.reset()
      toast.success('Dados iniciais restaurados', { description: 'O catálogo voltou ao conteúdo original.' })
    } catch (err) {
      toast.error(errorMessage(err, 'Não foi possível restaurar os dados iniciais.'))
    }
  }

  const exportBeforeButton = (
    <Button variant="outline" size="sm" onClick={downloadBackup}>
      <Download aria-hidden />
      Exportar backup atual antes
    </Button>
  )

  return (
    <SettingsSection
      index={1}
      icon={Database}
      title="Dados do catálogo"
      description="Os dados ficam salvos apenas neste navegador. Exporte backups para guardar ou levar para outro dispositivo."
    >
      {/* uso do armazenamento */}
      <div className="px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
              Armazenamento local
              {storage.data && (
                <Badge tone={pristine ? 'neutral' : 'brand'}>{pristine ? 'Dados iniciais' : 'Personalizado'}</Badge>
              )}
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              {pristine
                ? 'Usando os dados iniciais do site — nada foi alterado neste navegador ainda.'
                : 'Suas alterações estão salvas neste navegador.'}
            </p>
          </div>
          <div className="text-sm text-subtle tabular-nums">
            {storage.isPending ? (
              <Skeleton className="h-6 w-28 rounded-md" />
            ) : (
              <>
                <strong className="text-lg font-extrabold tracking-tight text-fg">{formatBytes(bytes)}</strong> de ~5 MB
              </>
            )}
          </div>
        </div>

        <div
          role="meter"
          aria-label="Uso do armazenamento local"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={`${formatBytes(bytes)} de aproximadamente 5 MB (${pct.toLocaleString('pt-BR')}%)`}
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-2"
        >
          <m.div
            className={cn('h-full rounded-full', meterTone)}
            initial={reduceMotion ? false : { width: 0 }}
            animate={{ width: `${Math.max(ratio > 0 ? 1.5 : 0, ratio * 100)}%` }}
            transition={{ duration: 0.7, ease: EASE }}
          />
        </div>

        <p className="mt-2.5 text-xs text-subtle">
          {products.data && categories.data && distributors.data ? (
            <>
              Catálogo atual: {pluralize(products.data.length, 'produto', 'produtos')},{' '}
              {pluralize(categories.data.length, 'categoria', 'categorias')} e{' '}
              {pluralize(distributors.data.length, 'distribuidor', 'distribuidores')} · {pct.toLocaleString('pt-BR')}%
              do limite usado
            </>
          ) : (
            'Calculando…'
          )}
        </p>
      </div>

      <SettingRow
        title="Exportar backup"
        description="Baixa um arquivo .json com todos os produtos, categorias e distribuidores."
      >
        <Button variant="outline" size="sm" onClick={downloadBackup}>
          <Download aria-hidden />
          Exportar
        </Button>
      </SettingRow>

      <SettingRow
        title="Importar backup"
        description="Substitui o catálogo atual pelo conteúdo de um arquivo exportado por este painel."
      >
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => void handleFile(event)}
        />
        <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
          <Upload aria-hidden />
          Importar…
        </Button>
      </SettingRow>

      <SettingRow
        title="Restaurar dados iniciais"
        description={
          pristine
            ? 'O catálogo já está com os dados iniciais.'
            : 'Descarta todas as alterações feitas neste navegador e volta ao catálogo original.'
        }
      >
        <Button
          variant="outline"
          size="sm"
          disabled={pristine}
          onClick={() => setResetOpen(true)}
          className="text-danger-600 hover:border-danger-500/40 hover:bg-red-500/[0.06] dark:text-red-400"
        >
          <RotateCcw aria-hidden />
          Restaurar
        </Button>
      </SettingRow>

      <ConfirmDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Substituir o catálogo atual?"
        confirmLabel="Importar e substituir"
        onConfirm={confirmImport}
        description={
          candidate && (
            <>
              O conteúdo de <strong className="font-semibold break-all text-fg">{candidate.fileName}</strong> (
              {formatBytes(candidate.size)}) vai substituir todo o catálogo:{' '}
              {pluralize(candidate.counts.products, 'produto', 'produtos')},{' '}
              {pluralize(candidate.counts.categories, 'categoria', 'categorias')} e{' '}
              {pluralize(candidate.counts.distributors, 'distribuidor', 'distribuidores')}. Esta ação não pode ser
              desfeita.
            </>
          )
        }
      >
        {exportBeforeButton}
      </ConfirmDialog>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Restaurar os dados iniciais?"
        confirmLabel="Restaurar dados"
        onConfirm={confirmReset}
        description="Produtos, categorias, distribuidores e imagens enviadas neste navegador serão descartados. Esta ação não pode ser desfeita."
      >
        {exportBeforeButton}
      </ConfirmDialog>
    </SettingsSection>
  )
}

// ------------------------------------------------------------------ (c) teste de desempenho

/** Deixa o navegador pintar o estado de carregamento antes de um trabalho síncrono pesado. */
function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => window.setTimeout(resolve, 0)))
}

function PerformanceSection() {
  const products = useProducts({ includeInactive: true })
  const [amount, setAmount] = useState(1000)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)

  const { stressCount, realCount } = useMemo(() => {
    const list = products.data ?? []
    const stress = list.reduce((n, p) => (p.id.startsWith(STRESS_ID_PREFIX) ? n + 1 : n), 0)
    return { stressCount: stress, realCount: list.length - stress }
  }, [products.data])

  function askGenerate(n: number) {
    setAmount(n)
    setGenerateOpen(true)
  }

  async function generate() {
    await nextPaint()
    const started = performance.now()
    try {
      const created = await adminService.generateStressData(amount)
      if (created === 0) {
        toast.error('Cadastre ao menos um produto real antes de gerar dados de teste.')
        return
      }
      const elapsed = Math.round(performance.now() - started)
      toast.success(`${formatCount(created)} produtos de teste gerados`, {
        description: `Concluído em ${formatCount(elapsed)} ms. Use o catálogo para testar busca, filtros e paginação.`,
        action: { label: 'Abrir catálogo', onClick: () => window.open('/catalogo', '_blank', 'noopener') },
      })
    } catch (err) {
      toast.error(errorMessage(err, 'Não foi possível gerar os produtos de teste.'))
    }
  }

  async function clear() {
    await nextPaint()
    try {
      const removed = await adminService.clearStressData()
      toast.success(
        removed > 0
          ? `${pluralize(removed, 'produto de teste removido', 'produtos de teste removidos')}`
          : 'Não havia produtos de teste.',
      )
    } catch (err) {
      toast.error(errorMessage(err, 'Não foi possível remover os produtos de teste.'))
    }
  }

  const loading = products.isPending
  // sem produtos reais não há de onde copiar imagens/categorias
  const noBase = !loading && realCount === 0
  const stats: Array<{ label: string; value: number; highlight?: boolean }> = [
    { label: 'Produtos reais', value: realCount },
    { label: 'Produtos de teste', value: stressCount, highlight: stressCount > 0 },
    { label: 'Total no catálogo', value: realCount + stressCount },
  ]

  return (
    <SettingsSection
      index={2}
      icon={Gauge}
      title="Teste de desempenho"
      description="Simule um catálogo grande e confira se a loja continua rápida."
    >
      <div className="px-5 py-5 sm:px-6">
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Gera produtos sintéticos reaproveitando as imagens, categorias e distribuidores reais, para validar busca,
          filtros e paginação com milhares de itens. Eles recebem a tag{' '}
          <code className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.75rem] text-fg">teste-de-carga</code>{' '}
          e podem ser removidos a qualquer momento.
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                'rounded-xl border px-3 py-3 sm:px-4',
                stat.highlight ? 'border-brand-500/25 bg-brand-500/[0.06]' : 'border-line bg-surface/60',
              )}
            >
              <dt className="truncate text-[0.6875rem] font-semibold text-subtle sm:text-xs">{stat.label}</dt>
              <dd className="mt-1 text-xl font-extrabold tracking-tight text-fg tabular-nums sm:text-2xl">
                {loading ? <Skeleton className="h-7 w-14 rounded-md" /> : formatCount(stat.value)}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-surface/50 px-5 py-4 sm:px-6">
        <Button variant="secondary" size="sm" disabled={noBase} onClick={() => askGenerate(1000)}>
          <FlaskConical aria-hidden />
          Gerar 1.000
        </Button>
        <Button variant="outline" size="sm" disabled={noBase} onClick={() => askGenerate(5000)}>
          Gerar 5.000
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={stressCount === 0}
          onClick={() => setClearOpen(true)}
          className="text-danger-600 hover:bg-red-500/[0.07] dark:text-red-400"
        >
          <Trash2 aria-hidden />
          Remover produtos de teste
        </Button>
        <a
          href="/catalogo"
          target="_blank"
          rel="noopener noreferrer"
          className="group/cat ml-auto inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-fg max-sm:ml-0"
        >
          Abrir catálogo
          <ArrowUpRight
            className="size-4 transition-transform duration-300 ease-out-expo group-hover/cat:translate-x-0.5 group-hover/cat:-translate-y-0.5"
            aria-hidden
          />
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      </div>

      <ConfirmDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        tone="primary"
        title={`Gerar ${formatCount(amount)} produtos de teste?`}
        confirmLabel={`Gerar ${formatCount(amount)}`}
        onConfirm={generate}
        description={
          <>
            Serão criados {formatCount(amount)} produtos sintéticos a partir de{' '}
            {pluralize(realCount, 'produto real', 'produtos reais')}
            {stressCount > 0 ? `, substituindo os ${formatCount(stressCount)} produtos de teste atuais` : ''}. Eles
            ficam visíveis na loja e ocupam espaço no armazenamento local até serem removidos.
          </>
        }
      />

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Remover produtos de teste?"
        confirmLabel="Remover"
        onConfirm={clear}
        description={`${pluralize(stressCount, 'produto sintético será removido', 'produtos sintéticos serão removidos')}. Os produtos reais não são afetados.`}
      />
    </SettingsSection>
  )
}

// ------------------------------------------------------------------ (d) acesso

const sessionDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })

function AccessSection() {
  const user = useAuthStore((s) => s.user)
  const expiresAt = useAuthStore((s) => s.expiresAt)

  return (
    <SettingsSection
      index={3}
      icon={ShieldAlert}
      title="Acesso"
      description="Quem entra no painel e como a sessão é protegida."
    >
      <div className="px-5 py-5 sm:px-6">
        <div className="flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.08] p-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <div className="min-w-0 text-sm leading-relaxed">
            <p className="font-bold text-fg">Autenticação de demonstração (mock)</p>
            <p className="mt-1 text-muted">
              O login deste painel é um mock de desenvolvimento: usuário e senha ficam no próprio código do site (
              <code className="rounded-md bg-amber-500/15 px-1.5 py-0.5 font-mono text-[0.75rem] text-fg">
                src/services/auth.ts
              </code>
              ) e podem ser lidos por qualquer pessoa. Antes de publicar, troque por um provedor de autenticação real —
              por exemplo, Supabase Auth — mantendo a mesma interface do serviço.
            </p>
          </div>
        </div>
      </div>

      {user && (
        <SettingRow
          title="Sessão atual"
          description={expiresAt ? `Expira em ${sessionDate.format(new Date(expiresAt))}.` : undefined}
        >
          <span className="inline-flex items-center gap-2 text-sm">
            <span className="font-semibold text-fg">{user.name}</span>
            <span className="text-subtle">@{user.username}</span>
          </span>
        </SettingRow>
      )}
    </SettingsSection>
  )
}
