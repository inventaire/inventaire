import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { isValidIsbn, normalizeIsbn, toIsbn13 } from '#lib/isbn/isbn'
import type { InvEntity, IsbnEntityUri, RemovedPlaceholderEntity, Claims } from '#types/entity'
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
  if (!getFirstClaimValue(claims, 'wdt:P629') || !getFirstClaimValue(claims, 'wdt:P1476')) return

  const isbn13h = getFirstClaimValue(claims, 'wdt:P212')
  // Checking isbn validity, as some isbns on Wikidata aren't valid
  if (isbn13h && isValidIsbn(isbn13h)) {
    // By internal convention, ISBN URIs are without hyphen
    return `isbn:${normalizeIsbn(isbn13h)}` as IsbnEntityUri
  }
  const isbn10h = getFirstClaimValue(claims, 'wdt:P957')
  if (isbn10h && isValidIsbn(isbn10h)) {
    // By internal convention, ISBN URIs are without hyphen
    return `isbn:${toIsbn13(isbn10h)}` as IsbnEntityUri
  }
}
