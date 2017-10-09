__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ getAvatarsUrlsFromClaims } = require './get_avatars_from_claims'
getCommonsFilenamesFromClaims = require './get_commons_filenames_from_claims'

module.exports = (entity)->
  { claims } = entity
  # Test claims existance to prevent crash when used on meta entities
  # for which entities claims were deleted
  unless claims? then return []

  claimsImages = getCommonsFilenamesFromClaims claims
  return claimsImages.concat getAvatarsUrlsFromClaims(claims)
