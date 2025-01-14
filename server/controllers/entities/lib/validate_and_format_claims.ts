import { isArray } from 'lodash-es'
import { isNonEmptyPlainObject } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import type { AccessLevel } from '#lib/user_access_levels'
import { assertString } from '#lib/utils/assert_types'
import { objectKeys, typeOf } from '#lib/utils/types'
import type { Claims, EntityType, InvEntityId, PropertyUri } from '#types/entity'
import { getInvEntityType } from './get_entity_type.js'
import { validateAndFormatClaim } from './validate_and_format_claim.js'
import { validateClaimProperty } from './validate_claim_property.js'

interface ValidateAndFormatInvClaimsParams {
  claims: Claims
  type?: EntityType
  _id: string
  userAccessLevels?: AccessLevel[]
}
export async function validateAndFormatInvClaims ({ claims, type, _id, userAccessLevels }: ValidateAndFormatInvClaimsParams) {
  const wdtP31 = claims['wdt:P31']
  type = wdtP31 ? getInvEntityType(wdtP31) : type
  assertString(type)

  if (!isNonEmptyPlainObject(claims)) {
    throw newError('invalid claims', 400, { claims })
  }

  await validatePropertiesClaims(claims, type, _id, userAccessLevels)

  // Returning validated and formatted claims on the mutated object
  return claims
}

function validatePropertiesClaims (claims: Claims, type: EntityType, _id: InvEntityId, userAccessLevels?: AccessLevel[]) {
  const properties = objectKeys(claims)
  return Promise.all(properties.map(property => validatePropertyClaims(property, claims, type, _id, userAccessLevels)))
}

async function validatePropertyClaims (property: PropertyUri, claims: Claims, type: EntityType, _id: InvEntityId, userAccessLevels?: AccessLevel[]) {
  const propertyClaims = claims[property]

  if (!isArray(propertyClaims)) {
    throw newError('invalid property claim array', 400, {
      property,
      propertyClaims,
      type: typeOf(propertyClaims),
      expectedType: 'array',
    })
  }

  if (propertyClaims.length === 0) {
    delete claims[property]
    return
  }

  validateClaimProperty(type, property)

  // Commented-out as it should be needed in theory, as claim values are added by entity models
  // functions which already prevent duplicated values.
  // If it's actually needed, it should support both claim values and claim objects

  claims[property] = await Promise.all(propertyClaims.map(newClaim => validateAndFormatClaim({
    type,
    property,
    oldClaim: null,
    newClaim,
    letEmptyValuePass: false,
    _id,
    userAccessLevels,
  })))
}
