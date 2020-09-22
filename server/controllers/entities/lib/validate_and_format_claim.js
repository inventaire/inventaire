const validateAndFormatClaimValue = require('./validate_and_format_claim_value')
const { validateProperty } = require('./properties/validations')

module.exports = async params => {
  const { property } = params
  validateProperty(property)
  return validateAndFormatClaimValue(params)
}
