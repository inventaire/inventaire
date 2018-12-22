__ = require('config').universalPath
_ = __.require('builders', 'utils')
assert_ = __.require 'utils', 'assert_types'
wdk = require 'wikidata-sdk'
whitelistedProperties = require './whitelisted_properties'
regroupClaims = require './regroup_claims'

options =
  entityPrefix: 'wd'
  propertyPrefix: 'wdt'
  timeConverter: 'simple-day'

module.exports = (claims, wdId)->
  assert_.types ['object', 'string'], [ claims, wdId ]
  whitelistedClaims = _.pick claims, whitelistedProperties
  prefixedSimplifiedClaims = wdk.simplifyClaims whitelistedClaims, options

  regroupClaims prefixedSimplifiedClaims

  return prefixedSimplifiedClaims
