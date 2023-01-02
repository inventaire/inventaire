import validateAndFormatClaimValue from './validate_and_format_claim_value.js'
import { validateProperty } from './properties/validations.js'

export default async params => {
  const { property } = params
  validateProperty(property)
  return validateAndFormatClaimValue(params)
}
