import _ from 'builders/utils'
import assert_ from 'lib/utils/assert_types'
import wdk from 'wikidata-sdk'
import allowlistedProperties from './allowlisted_properties'
import { flattenQualifierProperties } from './data_model_adapter'
const { simplifyClaims } = wdk

const options = {
  entityPrefix: 'wd',
  propertyPrefix: 'wdt',
  timeConverter: 'simple-day'
}

export default claims => {
  assert_.object(claims)
  const allowlistedClaims = _.pick(claims, allowlistedProperties)
  const simplifiedClaims = simplifyClaims(allowlistedClaims, options)

  flattenQualifierProperties(simplifiedClaims, allowlistedClaims)

  return simplifiedClaims
}
