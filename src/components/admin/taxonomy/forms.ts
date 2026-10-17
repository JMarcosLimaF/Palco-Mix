/**
 * Regras do formulário de cada tipo (valores iniciais, validação e payload).
 */
import type { Category, CategoryInput, Distributor, DistributorInput } from '@/types/catalog'
import { formatPhone, isValidEmail, isValidPhone, isValidWebsite, normalizeWebsite } from './logic'
import type { FieldErrors, TaxonomyFormLogic } from './types'

export type CategoryExtra = { image: string }

export type DistributorExtra = { phone: string; email: string; website: string }

export const categoryForm: TaxonomyFormLogic<Category, CategoryInput, CategoryExtra> = {
  emptyExtra: { image: '' },
  extraFromEntity: (category) => ({ image: category.image ?? '' }),
  validateExtra: () => ({}),
  toInput: (values) => ({
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    image: values.image || undefined,
  }),
}

export const distributorForm: TaxonomyFormLogic<Distributor, DistributorInput, DistributorExtra> = {
  emptyExtra: { phone: '', email: '', website: '' },
  extraFromEntity: (distributor) => ({
    phone: distributor.phone ? formatPhone(distributor.phone) || distributor.phone : '',
    email: distributor.email ?? '',
    website: distributor.website ?? '',
  }),
  validateExtra: (values) => {
    const errors: FieldErrors<DistributorExtra> = {}
    if (values.phone.trim() && !isValidPhone(values.phone)) {
      errors.phone = 'Telefone incompleto. Use DDD + número, ex.: (81) 99999-9999.'
    }
    if (values.email.trim() && !isValidEmail(values.email)) {
      errors.email = 'E-mail inválido. Ex.: contato@marca.com.br'
    }
    if (values.website.trim() && !isValidWebsite(values.website)) {
      errors.website = 'Endereço inválido. Ex.: www.marca.com.br'
    }
    return errors
  },
  toInput: (values) => ({
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    phone: values.phone.trim() ? formatPhone(values.phone) : undefined,
    email: values.email.trim().toLowerCase() || undefined,
    website: values.website.trim() ? normalizeWebsite(values.website) : undefined,
  }),
}
