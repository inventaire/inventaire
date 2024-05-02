import { getFirstClaimValue } from '#models/entity'
import type { SimplifiedClaimsIncludingWdExtra } from '#server/types/entity'
import { getUrlFromEntityImageHash } from './entities.js'
import { getCommonsFilenamesFromClaims } from './get_commons_filenames_from_claims.js'

export function getEntityImagesFromClaims ({ claims }: { claims: SimplifiedClaimsIncludingWdExtra }) {
  // Test claims existance to prevent crash when used on meta entities
  // for which entities claims were deleted
  if (claims == null) return []

  const imageHash = getFirstClaimValue(claims, 'invp:P2')
  const invImageUrl = getUrlFromEntityImageHash(imageHash)
  const invImageUrls = invImageUrl ? [ invImageUrl ] : []

  const claimsImages = getCommonsFilenamesFromClaims(claims)

  return [ ...invImageUrls, ...claimsImages ]
}
