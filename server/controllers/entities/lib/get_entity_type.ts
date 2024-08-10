import { getClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { types } from '#lib/wikidata/aliases'
import type { ExtendedEntityType, InvPropertyClaims } from '#server/types/entity'
import type { SimplifiedPropertyClaims } from 'wikibase-sdk'

// Takes an entity wdt:P31 (instance of) claims array
// Returns a entity type string: work, edition, article, human, genre
export function getEntityType (wdtP31Claims: InvPropertyClaims | SimplifiedPropertyClaims): ExtendedEntityType | undefined {
  if (wdtP31Claims == null) return

  const wdtP31Values = wdtP31Claims.map(getClaimValue)

  for (const value of wdtP31Values) {
    const type = types[value]
    // return as soon as we get a type
    if (type) return type
  }
}
