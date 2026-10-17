# Palco Mix — Contrato de Design & Arquitetura

Documento de referência para quem implementa telas. **Leia antes de escrever código.**

## 1. Direção visual

Ultra-moderno, minimalista, rápido. Inspiração: vitrines premium de sneakers/moda (muito respiro, imagens grandes, tipografia forte, micro-interações curtas). A marca é **azul elétrico + preto intenso + branco**, com títulos em **itálico extra-negrito** (dinamismo do logo — a seta/chevron "em movimento").

- Nada de visual "template genérico de IA": evite gradientes roxos, sombras pesadas em tudo, emojis, cards dentro de cards dentro de cards, ícones decorativos em excesso.
- Azul é para **ação e destaque** (CTA, badge "Novo", links ativos, foco). Não pinte superfícies grandes de azul, exceto blocos de impacto (hero, faixa CTA) — e aí combine com preto.
- Preto (`ink-950`) é a segunda cor de marca: blocos escuros de alto contraste (hero, rodapé, faixa de marcas) ficam ótimos nos dois temas.
- Fotos de produto são **artes de divulgação (flyers)** com texto e preço embutidos, proporção ~5:6 (alguns 1:1 e 2:3). Use `object-contain` sobre a cor dominante (já automático em `ProductImage`) — **nunca corte** a arte com `object-cover` em cards/galerias. `cover` só em fundos desfocados decorativos.

## 2. Tokens (Tailwind v4 — `src/index.css`)

Superfícies/texto — SEMPRE semânticos (funcionam no claro e no escuro):

| Classe | Uso |
|---|---|
| `bg-bg` | fundo da página |
| `bg-surface` / `bg-surface-2` | faixas, áreas secundárias, inputs desabilitados, hovers |
| `bg-elevated` | cards, modais, popovers |
| `text-fg` / `text-muted` / `text-subtle` | texto principal / secundário / terciário |
| `border-line` / `border-line-strong` | divisórias / bordas de controles |
| `bg-overlay` | véu de modais |

Marca: `brand-50…950` (`brand-500` = #0066FF, `brand-600` = #0052CC), `ink-700…950` (#0D0D0D), `bg-brand-gradient`, `text-brand-gradient`, `logo-stripe` (faixa multicolor do logo, use com parcimônia).

Utilitários: `container-page` (largura máx. 88rem + gutter responsivo), `title-display` (itálico 800, tracking apertado — títulos de seção/hero), `eyebrow` (rótulo caixa-alta pequeno), `skeleton` (shimmer), `scrollbar-none`, `cv-auto` (content-visibility para listas longas).

Sombras: `shadow-card`, `shadow-card-hover`, `shadow-glow` (azul), `shadow-pop` (modais). Easing: `ease-out-expo` (padrão de todas as transições). Raios: cards `rounded-2xl`, painéis `rounded-3xl` (hero/modais), controles `rounded-xl`, botões/badges/pílulas `rounded-full`.

Tema escuro: classe `.dark` no `<html>` (variante `dark:`). Teste TODA tela nos dois temas.

Tipografia: Plus Jakarta Sans Variable (já carregada). Títulos de seção: `title-display text-3xl sm:text-4xl`. Hero: `title-display text-5xl sm:text-6xl lg:text-7xl`. Corpo `text-sm`/`text-base`, `text-muted` para apoio. Números/preços: `tabular-nums`.

## 3. Componentes prontos — reutilize, não recrie

| Import | O quê |
|---|---|
| `@/components/ui/button` → `Button` | variants `primary` `secondary` (preto) `outline` `ghost` `subtle` `danger` `whatsapp`; sizes `xs sm md lg icon icon-sm`; `loading` |
| `@/components/ui/button-variants` → `buttonVariants({variant,size,className})` | classes de botão para `<Link>`/`<a>` |
| `@/components/ui/badge` → `Badge` | tones `brand dark light neutral success warning danger outline glass` |
| `@/components/ui/form` → `Input Textarea Select Switch Checkbox Field` | `Field` liga label/hint/erro com aria automaticamente |
| `@/components/ui/modal` → `Modal Drawer` | Radix Dialog + Motion; Modal vira bottom-sheet no mobile; `hideHeader` mantém título p/ leitor de tela |
| `@/components/ui/confirm-dialog` → `ConfirmDialog` | confirmação de ações destrutivas (async, com loading) |
| `@/components/ui/feedback` → `Skeleton Spinner EmptyState` | |
| `@/components/ui/pagination` → `Pagination` | `page pageCount onPageChange` |
| `@/components/ui/theme-toggle` → `ThemeToggle` | |
| `@/components/brand/logo` → `Logo LogoMark LogoBadge` | `Logo variant="compact|full" inverted`; `LogoBadge` = selo circular oficial (raster) |
| `@/components/brand/social-icons` → `InstagramIcon WhatsAppIcon` | lucide v1 não tem ícones de marcas |
| `@/components/catalog/product-image` → `ProductImage` | srcset WebP + lazy + cor dominante + fade. Pai precisa de `relative` + proporção (`aspect-[5/6]`). Passe `sizes` real e `priority` acima da dobra |
| `@/components/catalog/product-card` → `ProductCard ProductCardSkeleton` | card padrão (clique abre Visualização Rápida). Passe `distributorName`/`categoryName` resolvidos |
| `@/components/catalog/price` → `Price` | preço efetivo + "de" riscado + `showDiscount` |
| `@/components/admin/ui` → `AdminPageHeader Panel PanelHeader` | |
| `@/components/admin/table-styles` → `tableStyles` | classes de tabela do admin |
| `@/components/admin/image-library-dialog` → `ImageLibraryDialog` | seletor de imagens de /produtos/ (`open onOpenChange onSelect(paths) multiple exclude`) |

Ícones: `lucide-react` v1 (ex.: `Search X ChevronLeft ChevronRight Eye Pencil Trash2 Plus Upload Image Star Sparkles ArrowRight ArrowUpRight SlidersHorizontal LayoutDashboard Package Tags Truck LogOut Menu Phone MapPin LoaderCircle Check CircleAlert Store Zap Filter Grid2x2`). **Não existe `Instagram`** — use `InstagramIcon`.

Toasts: `import { toast } from 'sonner'` → `toast.success('Produto salvo')`, `toast.error(errorMessage(err))` (`errorMessage` em `@/services/errors`).

## 4. Animação (Motion)

- O app usa `LazyMotion strict`: **use `m.div`, `m.span`… importados de `motion/react`. NUNCA `motion.div`** (lança erro em modo strict). `AnimatePresence`, `useReducedMotion`, `useInView`, `useScroll` etc. funcionam normalmente. Features `domMax` (inclui `layout`/`layoutId`/drag) são carregadas sob demanda.
- Durações curtas (150–450ms), easing `[0.16, 1, 0.3, 1]`. Entradas sutis (opacity + 8–16px). Nada de bounce exagerado.
- Micro-interações por CSS sempre que possível (hover/active com `transition` + `ease-out-expo`); Motion para entrada/saída, carrossel, layoutId de pílulas ativas.
- `MotionConfig reducedMotion="user"` já respeita "reduzir movimento".

## 5. Dados — nunca acesse localStorage/localDb nas telas

Hooks em `@/hooks/catalog` (TanStack Query):

- Leitura: `useProductQuery(query)` (filtros+facetas+paginação, mantém resultado anterior durante a troca), `useProducts({includeInactive})`, `useFeaturedProducts(limit)`, `useProduct(id)`, `useRelatedProducts(product)`, `useSearchSuggestions(termoDebounced)`, `useCategories()`, `useDistributors()`, `useCategoryUsage()`, `useDistributorUsage()`, `useDashboardStats()`, `useCatalogLookups()` (mapas id→nome).
- Escrita: `useCreateProduct`, `useUpdateProduct`, `usePatchProduct`, `useSetProductsStatus`, `useDeleteProduct(s)`, `useSaveCategory`, `useDeleteCategory`, `useSaveDistributor`, `useDeleteDistributor`. O cache se invalida sozinho após qualquer escrita (não invalide manualmente).
- Ferramentas: `adminService` (`@/services/admin`): `exportJson`, `importJson`, `reset`, `generateStressData(n)`, `clearStressData`, `storageInfo`.
- Regras de negócio/erros: services lançam `ServiceError` com mensagem pt-BR pronta.
- Tipos: `@/types/catalog`. `product.category`/`product.distributor` guardam **ids**; exiba nomes via `useCatalogLookups()`.
- Utilidades: `@/lib/utils` (`cn formatBRL formatDate effectivePrice hasPromo discountPercent isNewProduct productCode normalizeText slugify pluralize`), `@/lib/images` (`getImageSources listLibraryImages preloadImage`), `@/lib/upload` (`uploadProductImage ACCEPTED_IMAGE_TYPES`), `@/hooks/use-debounced-value`, `@/hooks/use-media-query`, `@/hooks/use-document-title` (`useDocumentTitle('Catálogo')` em toda página), `@/config/site` (`site whatsappLink NEW_PRODUCT_DAYS CATALOG_PAGE_SIZE`).

### Preço sob consulta e numeração

- `price === 0` significa **preço sob consulta** (`isPriceOnRequest(p)` em `@/lib/utils`). `Price` já exibe "Sob consulta"; CTAs devem levar ao WhatsApp. Ficam fora de filtros por faixa de preço e no fim das ordenações por preço.
- Numeração: `expandSizes(product.sizes)` (`@/lib/sizes`) transforma "34 ao 39" / "33/34 ao 39/40" em chips; `null` → exiba o texto.
- Selo de desconto no card só a partir de 10% (diferenças à vista × a prazo de 2–5% aparecem apenas como preço "de" riscado).

## 6. URL da vitrine e Visualização Rápida

- Filtros vivem na URL de `/catalogo` — `@/lib/catalog-params`: `parseCatalogParams`, `toCatalogParams`, `catalogHref(query)`, `SORT_OPTIONS`, `countActiveFilters`. Ex.: `catalogHref({ categories: ['tenis'] })`.
- Ao trocar filtros com `setSearchParams`, passe `{ preventScrollReset: true }` (e `replace: true` para digitação na busca) para não pular a página.
- Visualização Rápida: `useQuickView()` (`@/hooks/use-quick-view`) → `open(id)`, `close()`, `productId`. Controlada por `?p=<id>`; o `QuickViewHost` fica montado no `PublicLayout`, então qualquer `ProductCard` em qualquer página pública abre o modal.

## 7. Performance (requisito)

- Grade: paginação (24/página) + `ProductCard` memoizado + `cv-auto`. Só os primeiros 4 cards com `priority`.
- Imagens sempre via `ProductImage` com `sizes` coerente com a grade. Nunca `<img src="/produtos/...JPG">` cru em listas (originais têm 300 KB+).
- Busca com debounce (`useDebouncedValue`, 200–250ms).
- Evite estados globais desnecessários e re-renders da grade inteira; derive com `useMemo`.
- Páginas são lazy (rotas). Não importe nada do admin no público.

## 8. Acessibilidade e responsividade

- Mobile-first; teste 360px, 768px, 1024px, 1440px. Alvos de toque ≥ 40px. Sem scroll horizontal.
- Todo botão-ícone tem `aria-label`. Imagens com `alt` significativo (`alt=""` se decorativa).
- Foco visível (já global). Navegação por teclado no carrossel e menus. Use `<button>` para ações, `<Link>` para navegação.
- Textos em **português do Brasil**, tom direto e simpático ("Peça pelo WhatsApp", "Ver catálogo").

## 9. Convenções de código

- TypeScript estrito; componentes função; arquivos de página com `export default`. Imports absolutos `@/…`.
- Arquivos `.tsx` exportam só componentes (regra do react-refresh); helpers em `.ts`.
- Sem `any`, sem `// @ts-ignore`. Comentários curtos em pt-BR onde a intenção não é óbvia.
- Contato da loja: `site.whatsapp`, `site.instagram` (`@/config/site`). Mensagens do WhatsApp com `whatsappLink(texto)`.
