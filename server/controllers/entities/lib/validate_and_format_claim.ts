import { validateProperty } from './properties/validations.js'
import { validateAndFormatClaimValue } from './validate_and_format_claim_value.js'

export async function validateAndFormatClaim (params) {
  const { property } = params
  validateProperty(property)
  return validateAndFormatClaimValue(params)
}
