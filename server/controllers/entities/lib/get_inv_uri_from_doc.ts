import { normalizeIsbn } from '#lib/isbn/isbn'
import { getFirstClaimValue } from '#models/entity'
import type { InvEntity, IsbnEntityUri, RemovedPlaceholderEntity } from '#server/types/entity'
import { prefixifyInv } from './prefix.js'

export function getInvUriFromDoc (entity: InvEntity | RemovedPlaceholderEntity) {
  // Case when the entity document is a proper entity document
  // but has a more broadly recognized URI available, currently only an ISBN
  const { claims } = entity
  const invUri = prefixifyInv(entity._id)

  const isbn = getFirstClaimValue(claims, 'wdt:P212')

  // Those URIs are aliases but, when available, always use the canonical id,
  // that is, in the only current, the ISBN
  // By internal convention, ISBN URIs are without hyphen
  return isbn ? (`isbn:${normalizeIsbn(isbn)}` as IsbnEntityUri) : invUri
}
