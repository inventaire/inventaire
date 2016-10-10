__ = require('config').universalPath
_ = __.require('builders', 'utils')
wdk = require 'wikidata-sdk'
whitelistedProperties = require './whitelisted_properties'
prefixify = require './prefixify'
regroupClaims = require './regroup_claims'

module.exports = (claims)->
  prefixedClaims = {}

  for prop, values of wdk.simplifyClaims(pickWhitelistedClaims(claims))

    if prop in hasFormatter
      values = values.map wikidataToInvFormatters[prop]

    prefixedClaims["wdt:#{prop}"] = values.map prefixify

    regroupClaims prefixedClaims

  return prefixedClaims

# Remove unused claims
pickWhitelistedClaims = (claims)-> _.pick claims, whitelistedProperties

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
