__ = require('config').universalPath
_ = __.require('builders', 'utils')
wdk = require 'wikidata-sdk'
whitelistedProperties = require './whitelisted_properties'
regroupClaims = require './regroup_claims'

options =
  entityPrefix: 'wd'
  propertyPrefix: 'wdt'
  timeConverter: 'simple-day'

module.exports = (claims, wdId)->
  _.assertTypes arguments, ['object', 'string']
  whitelistedClaims = _.pick claims, whitelistedProperties
  prefixedSimplifiedClaims = wdk.simplifyClaims whitelistedClaims, options

  regroupClaims prefixedSimplifiedClaims

  return prefixedSimplifiedClaims
