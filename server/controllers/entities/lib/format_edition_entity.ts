import { getFirstClaimValue, simplifyInvClaims } from '#controllers/entities/lib/inv_claims_utils'
import { normalizeIsbn } from '#lib/isbn/isbn'
import type { InvEntity, IsbnEntityUri } from '#types/entity'
import { formatInvEntityCommon } from './format_inv_entity_common.js'

export function formatEditionEntity (entity: InvEntity, { includeReferences = false }) {
  const isbn = getFirstClaimValue(entity.claims, 'wdt:P212')
  return formatInvEntityCommon({
    ...entity,
    uri: `isbn:${normalizeIsbn(isbn)}` as IsbnEntityUri,
    type: 'edition',
    claims: simplifyInvClaims(entity.claims, { keepReferences: includeReferences }),
  })
}
