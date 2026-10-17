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

/** Extrai uma mensagem amigável de qualquer erro. */
export function errorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
