const _ = require('builders/utils')
const assert_ = require('lib/utils/assert_types')
const wdk = require('wikidata-sdk')
const allowlistedProperties = require('./allowlisted_properties')

const options = {
  entityPrefix: 'wd',
  propertyPrefix: 'wdt',
  timeConverter: 'simple-day'
}

module.exports = (claims, wdId) => {
  assert_.object(claims)
  assert_.string(wdId)
  const allowlistedClaims = _.pick(claims, allowlistedProperties)
  return wdk.simplifyClaims(allowlistedClaims, options)
}
