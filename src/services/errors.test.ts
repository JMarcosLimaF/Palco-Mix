import { afterEach, describe, expect, it, vi } from 'vitest'
import { errorMessage, ServiceError } from '@/services/errors'

const FALLBACK = 'Algo deu errado. Tente novamente.'

describe('errorMessage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('mantém mensagens pt-BR do app', () => {
    expect(errorMessage(new ServiceError('validation', 'Informe o nome do produto.'))).toBe('Informe o nome do produto.')
    expect(errorMessage(new Error('O arquivo não é um JSON válido.'))).toBe('O arquivo não é um JSON válido.')

    class StorageQuotaError extends Error {
      constructor() {
        super('O armazenamento local do navegador está cheio.')
        this.name = 'StorageQuotaError'
      }
    }
    expect(errorMessage(new StorageQuotaError())).toBe('O armazenamento local do navegador está cheio.')
  })

  it('troca erros técnicos do navegador pela mensagem genérica', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(errorMessage(new TypeError('Failed to fetch'))).toBe(FALLBACK)
    expect(errorMessage(new SyntaxError('Unexpected token < in JSON'))).toBe(FALLBACK)
    expect(errorMessage(new DOMException('The source image cannot be decoded.', 'EncodingError'))).toBe(FALLBACK)
    expect(errorMessage(new DOMException("Failed to read the 'localStorage' property", 'SecurityError'), 'Falhou.')).toBe(
      'Falhou.',
    )
  })

  it('usa o fallback para valores que não são Error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(errorMessage('falha')).toBe(FALLBACK)
    expect(errorMessage(undefined, 'Não foi possível entrar.')).toBe('Não foi possível entrar.')
    expect(errorMessage(new Error(''))).toBe(FALLBACK)
  })
})
