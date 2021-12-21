const _ = require('builders/utils')
const assert_ = require('lib/utils/assert_types')
const { claims: simplifyClaims } = require('wikidata-sdk').simplify
const allowlistedProperties = require('./allowlisted_properties')
const { flattenQualifierProperties } = require('./data_model_adapter')

const options = {
  entityPrefix: 'wd',
  propertyPrefix: 'wdt',
  timeConverter: 'simple-day'
}

module.exports = (claims, wdId) => {
  assert_.object(claims)
  assert_.string(wdId)
  const allowlistedClaims = _.pick(claims, allowlistedProperties)
  const simplifiedClaims = simplifyClaims(allowlistedClaims, options)

  flattenQualifierProperties(simplifiedClaims, allowlistedClaims)

  return simplifiedClaims
}
