import { validateProperty } from './properties/validations.js'
import validateAndFormatClaimValue from './validate_and_format_claim_value.js'

export default async params => {
  const { property } = params
  validateProperty(property)
  return validateAndFormatClaimValue(params)
}
