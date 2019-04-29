__ = require('config').universalPath
_ = __.require('builders', 'utils')
assert_ = __.require 'utils', 'assert_types'
wdk = require 'wikidata-sdk'
whitelistedProperties = require './whitelisted_properties'

options =
  entityPrefix: 'wd'
  propertyPrefix: 'wdt'
  timeConverter: 'simple-day'

module.exports = (claims)->
  whitelistedClaims = _.pick claims, whitelistedProperties
  return wdk.simplifyClaims whitelistedClaims, options
