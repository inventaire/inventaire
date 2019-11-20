
const __ = require('config').universalPath
const promises_ = __.require('lib', 'promises')
const validateClaimValue = require('./validate_claim_value')
const { validateProperty } = require('./properties/validations')

module.exports = params => {
  const { property } = params
  return promises_.try(() => validateProperty(property))
  .then(() => validateClaimValue(params))
}
