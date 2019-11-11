// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const validateClaimValue = require('./validate_claim_value')
const { validateProperty } = require('./properties/validations')

module.exports = function(params){
  const { property } = params
  return promises_.try(() => validateProperty(property))
  .then(() => validateClaimValue(params))
}
