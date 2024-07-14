import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { normalizeIsbn } from '#lib/isbn/isbn'
import type { InvEntity, IsbnEntityUri, RemovedPlaceholderEntity, Claims } from '#server/types/entity'
import { prefixifyInv } from './prefix.js'

export function getInvUriFromDoc (entity: InvEntity | RemovedPlaceholderEntity) {
  // Case when the entity document is a proper entity document
  // but has a more broadly recognized URI available: ISBN or Wikidata id
  const { claims } = entity
  const invUri = prefixifyInv(entity._id)

  // Those URIs are aliases but, when available, always use the Wikidata id or the ISBN

  // When available, prefer the ISBN to the Wikidata id, as Wikidata editions are more likely to be disurpted
  // Ex: A Wikidata edition might be turned into a work, while an inventory item would still want
  // to hold a reference to the edition entity
  const isbnUri = getIsbnUriFromClaims(claims)
  if (isbnUri) return isbnUri

  const wdUri = getFirstClaimValue(claims, 'invp:P1')
  if (wdUri) return wdUri

  return invUri
}

export function getIsbnUriFromClaims (claims: Claims) {
  // Do not give an isbn uri to malformed edition entities (ie, editions without an associated work or a title)
  if (!claims['wdt:P629']?.[0] || !claims['wdt:P1476']?.[0]) return

  const isbn13h = getFirstClaimValue(claims, 'wdt:P212')
  // By internal convention, ISBN URIs are without hyphen
  if (isbn13h) return `isbn:${normalizeIsbn(isbn13h)}` as IsbnEntityUri
}
