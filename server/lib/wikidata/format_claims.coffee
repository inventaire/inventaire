__ = require('config').universalPath
_ = __.require('builders', 'utils')
wdk = require 'wikidata-sdk'
whitelistedProperties = require './whitelisted_properties'
prefixify = require './prefixify'
regroupClaims = require './regroup_claims'

module.exports = (claims, wdId)->
  prefixedClaims = {}

  for prop, values of wdk.simplifyClaims(pickWhitelistedClaims(claims, wdId))

    if prop in hasFormatter
      values = values.map wikidataToInvFormatters[prop]

    prefixedClaims["wdt:#{prop}"] = values.map prefixify

    regroupClaims prefixedClaims

  return prefixedClaims

# Remove unused claims
pickWhitelistedClaims = (claims, wdId)->
  allProperties = Object.keys claims
  keep = _.pick claims, whitelistedProperties
  removedProperties = _.difference allProperties, Object.keys(keep)
  if removedProperties.length > 0
    # Converting to String to log properties on one line
    _.warn removedProperties.toString(), "#{wdId} filtered-out claims"
  return keep

# Functions to convert Wikidata properties values to Inv entities custom formats
wikidataToInvFormatters =
  # convert epoch time to simple-day format
  P577: (date)->
    new Date(date)
    .toISOString()
    .split('T')[0]
    # turn -000074-10-12 into -74-10-12
    .replace /^(-)?0+/, '$1'

hasFormatter = Object.keys wikidataToInvFormatters
