import validateAndFormatClaimValue from './validate_and_format_claim_value'
import { validateProperty } from './properties/validations'

export default async params => {
  const { property } = params
  validateProperty(property)
  return validateAndFormatClaimValue(params)
}
