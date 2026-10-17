/**
 * Caminhos públicos respeitando o `base` do Vite.
 * No dev é `/`; no GitHub Pages do repositório é `/Palco-Mix/`.
 */

/** Arquivo em `public/` ou URL já absoluta (http, data, blob). */
export function publicAsset(path: string): string {
  if (!path || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) return path
  const base = import.meta.env.BASE_URL
  if (base === '/' || path.startsWith(base)) return path
  return path.startsWith('/') ? `${base}${path.slice(1)}` : `${base}${path}`
}

/** Rota da app para um `<a href>` (nova aba, fora do React Router). */
export function appHref(path: string): string {
  return publicAsset(path.startsWith('/') ? path : `/${path}`)
}
