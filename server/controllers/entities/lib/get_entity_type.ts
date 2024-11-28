import { compact, pick, uniq } from 'lodash-es'
import { simplifyClaims, type Item as RawWdEntity } from 'wikibase-sdk'
import { getClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { isNonEmptyArray } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { warn } from '#lib/utils/logs'
import { typesByExtendedP31AliasesValues } from '#lib/wikidata/extended_aliases'
import type { ExtendedEntityType, InvPropertyClaims, Claims, EntityUri, InvClaim, EntityType } from '#types/entity'

export function getInvEntityType (wdtP31Claims: InvPropertyClaims): EntityType {
  if (wdtP31Claims == null) return
  if (wdtP31Claims.length !== 1) {
    throw newError('invalid inv entity wdt:P31 claim array', 400, { wdtP31Claims })
  }
  const type = getP31Type(wdtP31Claims[0]) as EntityType
  return type
}

/** This function typically addresses Wikidata inconsistencies */
export function getStrictEntityType (claims: Claims, uri?: EntityUri): ExtendedEntityType | undefined {
  const wdtP31Claims = claims['wdt:P31']
  if (wdtP31Claims == null) return
  const types = uniq(compact(wdtP31Claims.flatMap(getP31Type)))
  const type = types[0]
  if (type === 'edition') {
    if (types.length !== 1) {
      warn({ uri, claims }, 'too many types found')
    } else if (isNonEmptyArray(claims['wdt:P629']) && isNonEmptyArray(claims['wdt:P1476'])) {
      return type
    } else {
      warn({ uri, claims }, 'insufficiant edition claims')
    }
  } else {
    return type
  }
}

const typeRelevantProperties = [
  'P31',
  'P629',
  'P1476',
] as const

const simplifyClaimsOptions = { entityPrefix: 'wd', propertyPrefix: 'wdt' }

export function getWdEntityType (entity: RawWdEntity) {
  const relevantClaims = pick(entity.claims, typeRelevantProperties)
  const simplifiedRelevantClaims = simplifyClaims(relevantClaims, simplifyClaimsOptions)
  return getStrictEntityType(simplifiedRelevantClaims, `wd:${entity.id}`)
}

function getP31Type (claim: InvClaim) {
  const value = getClaimValue(claim)
  return typesByExtendedP31AliasesValues[value]
}
