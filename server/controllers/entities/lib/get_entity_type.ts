import { compact, pick, uniq } from 'lodash-es'
import { simplifyClaims, type Item as RawWdEntity } from 'wikibase-sdk'
import { getClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { isNonEmptyArray } from '#lib/boolean_validations'
import { warn } from '#lib/utils/logs'
import { types } from '#lib/wikidata/aliases'
import type { ExtendedEntityType, InvPropertyClaims, Claims, EntityUri, InvClaim } from '#server/types/entity'

export function getEntityType (wdtP31Claims: InvPropertyClaims): ExtendedEntityType | undefined {
  if (wdtP31Claims == null) return

  for (const claim of wdtP31Claims) {
    const type = getP31Type(claim)
    if (type) return type
  }
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
  'wdt:P31',
  'wdt:P629',
  'wdt:P1476',
] as const

const simplifyClaimsOptions = { entityPrefix: 'wd' }

export function getWdEntityStrictEntityType (entity: RawWdEntity) {
  const relevantClaims = pick(entity.claims, typeRelevantProperties)
  const simplifiedRelevantClaims = simplifyClaims(relevantClaims, simplifyClaimsOptions)
  return getStrictEntityType(simplifiedRelevantClaims, `wd:${entity.id}`)
}

function getP31Type (claim: InvClaim) {
  const value = getClaimValue(claim)
  return types[value]
}
