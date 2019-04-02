__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
validateClaimValue = require './validate_claim_value'
{ validateProperty } = require './properties/validations'

module.exports = (params)->
  { property } = params
  promises_.try -> validateProperty property
  .then -> validateClaimValue params
