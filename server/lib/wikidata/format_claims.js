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

module.exports = (claims, wdId) => {
  assert_.object(claims)
  assert_.string(wdId)
  const whitelistedClaims = _.pick(claims, whitelistedProperties)
  return wdk.simplifyClaims(whitelistedClaims, options)
}
