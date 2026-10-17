/** Dados institucionais da loja (WhatsApp conforme as artes oficiais; Instagram informado pela loja). */
export const site = {
  name: 'Palco Mix',
  fullName: 'Palco Mix Calçados e Acessórios',
  tagline: 'Calçados e Acessórios',
  description:
    'Chinelos, rasteirinhas, tamancos, sandálias e tênis das marcas que você ama — com atendimento direto pelo WhatsApp.',
  whatsapp: {
    /** E.164 sem "+" para links wa.me */
    number: '5581996395100',
    display: '(81) 9.9639-5100',
  },
  /**
   * A vitrine pública NÃO exibe preços: o cliente vê o produto e pede pelo WhatsApp.
   * Os preços continuam no cadastro (painel admin) como informação interna.
   * Para voltar a mostrar preços na loja, troque para `true`.
   */
  showPrices: false as boolean,
  instagram: {
    handle: 'palcomix_bj',
    url: 'https://www.instagram.com/palcomix_bj/',
  },
} as const

/** Link de WhatsApp com mensagem pré-preenchida. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${site.whatsapp.number}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

/** Dias em que um produto recebe o selo "Novo". */
export const NEW_PRODUCT_DAYS = 30

/** Tamanho de página padrão da vitrine. */
export const CATALOG_PAGE_SIZE = 24
