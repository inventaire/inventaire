
const { getAvatarsUrlsFromClaims } = require('./get_avatars_from_claims')
const getCommonsFilenamesFromClaims = require('./get_commons_filenames_from_claims')
const { getUrlFromEntityImageHash } = require('./entities')

module.exports = entity => {
  const { claims } = entity
  // Test claims existance to prevent crash when used on meta entities
  // for which entities claims were deleted
  if (claims == null) return []

  const invImageUrl = getUrlFromEntityImageHash(claims['invp:P2'] != null ? claims['invp:P2'][0] : undefined)
  const invImageUrls = (invImageUrl != null) ? [ invImageUrl ] : []
  const claimsImages = getCommonsFilenamesFromClaims(claims)
  const avatarsImages = getAvatarsUrlsFromClaims(claims)

  return invImageUrls.concat(claimsImages, avatarsImages)
}
