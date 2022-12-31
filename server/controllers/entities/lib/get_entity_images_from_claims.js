import getCommonsFilenamesFromClaims from './get_commons_filenames_from_claims'
import { getUrlFromEntityImageHash } from './entities'

export default ({ claims }) => {
  // Test claims existance to prevent crash when used on meta entities
  // for which entities claims were deleted
  if (claims == null) return []

  const imageHash = claims['invp:P2'] && claims['invp:P2'][0]
  const invImageUrl = getUrlFromEntityImageHash(imageHash)
  const invImageUrls = invImageUrl ? [ invImageUrl ] : []

  const claimsImages = getCommonsFilenamesFromClaims(claims)

  return invImageUrls.concat(claimsImages)
}
