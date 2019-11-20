const { getAvatarsUrlsFromClaims } = require('./get_avatars_from_claims')
const getCommonsFilenamesFromClaims = require('./get_commons_filenames_from_claims')
const { getUrlFromEntityImageHash } = require('./entities')
const _ = require('lodash')

module.exports = entity => {
  const { claims } = entity
  // Test claims existance to prevent crash when used on meta entities
  // for which entities claims were deleted
  if (claims == null) return []

  const imageHash = _.get(claims, 'invp:P2.0')
  const invImageUrl = getUrlFromEntityImageHash(imageHash)
  const invImageUrls = invImageUrl ? [ invImageUrl ] : []

  const claimsImages = getCommonsFilenamesFromClaims(claims)
  const avatarsImages = getAvatarsUrlsFromClaims(claims)

  return invImageUrls.concat(claimsImages, avatarsImages)
}
