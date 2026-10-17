# Palco Mix · Calçados e Acessórios

Catálogo digital / e-commerce da **Palco Mix**: vitrine pública ultra-rápida com busca instantânea, filtros avançados e Visualização Rápida, mais um painel administrativo com CRUD completo de produtos, categorias e distribuidores.

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · React Router · TanStack Query · Motion · Radix · Zustand

## Começando

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento (com upload de imagens para `public/produtos/uploads/`) |
| `npm run build` | checagem de tipos + build de produção em `dist/` |
| `npm run preview` | serve o build localmente |
| `npm test` | testes de unidade (motor de busca/filtros, URL, utilitários) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run images` | gera miniaturas WebP + manifesto das imagens de `public/produtos/` |

### Painel administrativo

Acesse **`/admin`** — usuário **`admin`**, senha **`123456`**.

> A autenticação é um **mock de desenvolvimento** (`src/services/auth.ts`): as credenciais ficam no código do navegador e não protegem nada de verdade. Antes de publicar com dados reais, troque por um provedor de autenticação (ex.: Supabase Auth) mantendo a mesma API do serviço.

## Estrutura

```
public/produtos/            imagens dos produtos (artes originais)
public/produtos/_thumbs/    miniaturas WebP 400/800 px (npm run images)
src/
  app/                      providers, rotas (lazy), layout raiz, erro
  components/
    ui/                     design system (Button, Modal, Field, Pagination…)
    brand/                  logo vetorial, ícones sociais
    catalog/                ProductCard, ProductImage, Price, Quick View, filtros…
    layout/                 cabeçalho, busca inteligente, rodapé
    home/                   hero carousel e seções da página inicial
    admin/                  componentes do painel
  data/db.json              seed do banco (91 produtos, 15 marcas, 7 categorias)
  data/image-manifest.json  dimensões + cor dominante + miniaturas (gerado)
  hooks/catalog.ts          hooks de dados (TanStack Query) — porta única da UI
  lib/catalog-query.ts      motor de busca/filtros/facetas/ordenação/paginação (puro, testado)
  lib/db/local-db.ts        banco local (localStorage) com sincronização entre abas
  services/                 produtos, categorias/distribuidores, auth, admin
  pages/                    páginas públicas e do painel
DESIGN.md                   contrato de design (tokens, componentes, regras)
```

## Dados e persistência

- Na primeira visita o catálogo vem de `src/data/db.json`. Qualquer alteração feita no painel é salva no **localStorage** do navegador (`palcomix:db`) e sincronizada entre abas.
- Em **Admin → Configurações** dá para exportar/importar o banco em JSON (mesmo formato do `db.json`), restaurar os dados iniciais e gerar milhares de produtos de teste para validar desempenho.
- **Imagens enviadas pelo painel**: em `npm run dev` são gravadas em `public/produtos/uploads/`; no site publicado (estático) viram data URL comprimida dentro do banco local.
- Para trocar o armazenamento por um backend (ex.: Supabase), reimplemente `src/services/*` — as telas só conhecem os hooks de `src/hooks/catalog.ts`. O motor `lib/catalog-query.ts` documenta a semântica que a API deve oferecer (busca, filtros, facetas, paginação).

### Preço sob consulta

`price = 0` significa **preço sob consulta**: o site mostra "Sob consulta" e direciona para o WhatsApp. É o caso dos chinelos Coca-Cola, cujas artes não trazem preço.

### Adicionando produtos com imagens novas

1. Copie as imagens para `public/produtos/`.
2. Rode `npm run images` (gera as miniaturas e atualiza o manifesto).
3. No painel, cadastre o produto escolhendo as imagens em **Escolher da biblioteca**.

## Desempenho

- Home no bundle inicial; demais páginas e todo o painel carregam sob demanda.
- Imagens com `srcset` WebP (400/800 px), `loading="lazy"`, placeholder na cor dominante e `content-visibility` nos cards.
- Busca com debounce e consulta indexada (texto normalizado memoizado) — 20 mil produtos filtrados/ordenados em milissegundos (ver testes).
- Animações com Motion via `LazyMotion` (recursos carregados sob demanda) e respeito a "reduzir movimento".

## Publicação

É um SPA estático: publique a pasta `dist/` em qualquer hospedagem estática. Os arquivos `vercel.json` e `public/_redirects` (Netlify) já redirecionam todas as rotas para `index.html`.
