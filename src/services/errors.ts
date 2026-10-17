export type ServiceErrorCode = 'not_found' | 'validation' | 'conflict' | 'in_use' | 'unauthorized' | 'storage'

/** Erro de regra de negócio com mensagem pronta para o usuário (pt-BR). */
export class ServiceError extends Error {
  readonly code: ServiceErrorCode

  constructor(code: ServiceErrorCode, message: string) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
  }
}

/**
 * A mensagem pode ir para a tela? Só erros do próprio app: ServiceError,
 * StorageQuotaError (por nome, sem acoplar ao banco local) e `new Error('…')`
 * de validação. TypeError, SyntaxError e DOMException (SecurityError,
 * EncodingError…) trazem texto técnico do navegador, em inglês.
 */
function isUserFacing(error: Error): boolean {
  if (error instanceof ServiceError || error.name === 'StorageQuotaError') return true
  return Object.getPrototypeOf(error) === Error.prototype && error.name === 'Error'
}

/** Extrai uma mensagem amigável de qualquer erro. */
export function errorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (error instanceof Error && error.message && isUserFacing(error)) return error.message
  // o detalhe técnico fica só no console de desenvolvimento
  if (import.meta.env.DEV && error != null) console.error(error)
  return fallback
}
