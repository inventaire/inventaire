import { simplifyClaims } from 'wikibase-sdk'
import _ from '#builders/utils'
import { assert_ } from '#lib/utils/assert_types'
import { allowlistedProperties } from './allowlisted_properties.js'
import { flattenQualifierProperties } from './data_model_adapter.js'

const options = {
  entityPrefix: 'wd',
  propertyPrefix: 'wdt',
  timeConverter: 'simple-day',
}

export default claims => {
  assert_.object(claims)
  const allowlistedClaims = _.pick(claims, allowlistedProperties)
  const simplifiedClaims = simplifyClaims(allowlistedClaims, options)

  flattenQualifierProperties(simplifiedClaims, allowlistedClaims)

  return simplifiedClaims
}
