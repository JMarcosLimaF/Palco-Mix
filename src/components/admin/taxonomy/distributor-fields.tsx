import { Globe, Mail } from 'lucide-react'
import { useId } from 'react'
import { Field } from '@/components/ui/form'
import type { DistributorExtra } from './forms'
import { isValidWebsite, normalizeWebsite } from './logic'
import { PhoneInput } from './phone-input'
import { IconInput } from './taxonomy-ui'
import type { ExtraFieldsProps } from './types'

/** Campos de contato do distribuidor (todos opcionais). */
export function DistributorFields({ values, errors, setValue, validateField, disabled }: ExtraFieldsProps<DistributorExtra>) {
  const headingId = useId()

  return (
    <div role="group" aria-labelledby={headingId} className="flex flex-col gap-4 border-t border-line pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={headingId} className="eyebrow text-subtle">
          Contato
        </h3>
        <span className="text-xs text-subtle">Opcional</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefone" error={errors.phone}>
          <PhoneInput
            value={values.phone}
            onValueChange={(value) => setValue('phone', value)}
            onBlur={() => validateField('phone')}
            readOnly={disabled}
          />
        </Field>
        <Field label="E-mail" error={errors.email}>
          <IconInput
            icon={Mail}
            type="email"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="contato@marca.com.br"
            maxLength={120}
            value={values.email}
            onChange={(e) => setValue('email', e.target.value)}
            onBlur={() => validateField('email')}
            readOnly={disabled}
          />
        </Field>
      </div>

      <Field label="Site" hint="Pode digitar sem “https://” — completamos para você." error={errors.website}>
        <IconInput
          icon={Globe}
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="www.marca.com.br"
          maxLength={200}
          value={values.website}
          onChange={(e) => setValue('website', e.target.value)}
          onBlur={() => {
            // normaliza ao sair do campo (só quando o endereço é válido, para não "estragar" o que foi digitado)
            if (values.website.trim() && isValidWebsite(values.website)) {
              const normalized = normalizeWebsite(values.website)
              if (normalized !== values.website) setValue('website', normalized)
            }
            validateField('website')
          }}
          readOnly={disabled}
        />
      </Field>
    </div>
  )
}
