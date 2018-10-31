__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ getAvatarsUrlsFromClaims } = require './get_avatars_from_claims'
getCommonsFilenamesFromClaims = require './get_commons_filenames_from_claims'
{ getUrlFromEntityImageHash } = require './entities'

module.exports = (entity)->
  { claims } = entity
  # Test claims existance to prevent crash when used on meta entities
  # for which entities claims were deleted
  unless claims? then return []

  invImageUrl = getUrlFromEntityImageHash claims['invp:P2']?[0]
  claimsImages = getCommonsFilenamesFromClaims claims
  return [ invImageUrl ].concat claimsImages, getAvatarsUrlsFromClaims(claims)
