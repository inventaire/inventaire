// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('utils', 'assert_types')
const wdk = require('wikidata-sdk')
const whitelistedProperties = require('./whitelisted_properties')

const options = {
  entityPrefix: 'wd',
  propertyPrefix: 'wdt',
  timeConverter: 'simple-day'
}

module.exports = function(claims, wdId){
  assert_.types([ 'object', 'string' ], [ claims, wdId ])
  const whitelistedClaims = _.pick(claims, whitelistedProperties)
  return wdk.simplifyClaims(whitelistedClaims, options)
}
