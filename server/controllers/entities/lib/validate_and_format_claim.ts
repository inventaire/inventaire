import { validateProperty } from './properties/validations.js'
import { validateAndFormatClaimValue, type ValidateAndFormatClaimValueParams } from './validate_and_format_claim_value.js'

export async function validateAndFormatClaim (params: ValidateAndFormatClaimValueParams) {
  const { property } = params
  validateProperty(property)
  return validateAndFormatClaimValue(params)
}
