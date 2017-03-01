__ = require('config').universalPath
_ = __.require('builders', 'utils')
wdk = require 'wikidata-sdk'
whitelistedProperties = require './whitelisted_properties'
regroupClaims = require './regroup_claims'

module.exports = (claims, wdId)->
  _.types arguments, ['object', 'string']
  whitelistedClaims = pickWhitelistedClaims claims, wdId
  prefixedSimplifiedClaims = wdk.simplifyClaims whitelistedClaims, 'wd', 'wdt'

  for prop in hasFormatter
    values = prefixedSimplifiedClaims[prop]
    if values?
      formatter = wikidataToInvFormatters[prop]
      prefixedSimplifiedClaims[prop] = values.map formatter

  regroupClaims prefixedSimplifiedClaims

  return prefixedSimplifiedClaims

# Remove unused claims
pickWhitelistedClaims = (claims, wdId)->
  allProperties = Object.keys claims
  return _.pick claims, whitelistedProperties

# Functions to convert Wikidata properties values to Inv entities custom formats
wikidataToInvFormatters =
  # convert epoch time to simple-day format
  'wdt:P577': (date)->
    new Date(date)
    .toISOString()
    .split('T')[0]
    # turn -000074-10-12 into -74-10-12
    .replace /^(-)?0+/, '$1'

hasFormatter = Object.keys wikidataToInvFormatters
