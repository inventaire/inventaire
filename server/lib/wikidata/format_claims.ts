import { pick } from 'lodash-es'
import { simplifyClaims, type Claims as WdClaims } from 'wikibase-sdk'
import { toIsbn13h } from '#lib/isbn/isbn'
import { assertObject } from '#lib/utils/assert_types'
import type { ExtendedEntityType, SimplifiedClaimsIncludingWdExtra } from '#types/entity'
import { allowlistedProperties, allowlistedPropertiesPerType } from './allowlisted_properties.js'
import { flattenQualifierProperties } from './data_model_adapter.js'

const options = {
  entityPrefix: 'wd',
  propertyPrefix: 'wdt',
  timeConverter: 'simple-day',
  // Drop time snaks at century-precision and below
  minTimePrecision: 9,
} as const

export function formatClaims (claims: WdClaims, type?: ExtendedEntityType) {
  assertObject(claims)
  const pickedProperties = allowlistedPropertiesPerType[type] || allowlistedProperties
  const allowlistedClaims = pick(claims, pickedProperties)
  const simplifiedClaims: Partial<SimplifiedClaimsIncludingWdExtra> = simplifyClaims(allowlistedClaims, options)
  setInferredClaims(simplifiedClaims)

  flattenQualifierProperties(simplifiedClaims, allowlistedClaims)

  return simplifiedClaims
}

function setInferredClaims (claims: Partial<SimplifiedClaimsIncludingWdExtra>) {
  if (claims['wdt:P957']?.length === 1 && !claims['wdt:P212']) {
    const isbn10h = claims['wdt:P957'][0]
    const isbn13h = toIsbn13h(isbn10h)
    if (isbn13h) claims['wdt:P212'] = [ isbn13h ]
  }
}
