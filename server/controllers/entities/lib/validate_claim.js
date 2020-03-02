const validateClaimValue = require('./validate_claim_value')
const { validateProperty } = require('./properties/validations')

module.exports = async params => {
  const { property } = params
  validateProperty(property)
  return validateClaimValue(params)
}
