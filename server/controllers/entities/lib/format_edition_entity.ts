import { normalizeIsbn } from '#lib/isbn/isbn'
import { getClaimValue, simplifyInvClaims } from '#models/entity'
import type { SerializedInvEntity } from '#server/types/entity'
import formatEntityCommon from './format_entity_common.js'

export default entity => {
  const isbn = getClaimValue(entity.claims['wdt:P212'][0])
  entity.uri = `isbn:${normalizeIsbn(isbn)}`
  entity.type = 'edition'
  entity.claims = simplifyInvClaims(entity.claims)
  return formatEntityCommon(entity) as SerializedInvEntity
}
