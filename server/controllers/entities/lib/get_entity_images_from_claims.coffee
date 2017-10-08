__ = require('config').universalPath
_ = __.require 'builders', 'utils'

module.exports = (entity)->
  { claims } = entity
  # Test claims existance to prevent crash when used on meta entities
  # for which entities claims were deleted
  unless claims? then return []

  claimsImages = _.flatten _.values(_.pick(claims, imageClaims))
  claimsAvatars = avatarProperties.reduce aggregateAvatars(claims), []

  return claimsImages.concat claimsAvatars

imageClaims = [
  # image
  'wdt:P18'
  # logo image
  'wdt:P154'
  # collage image
  'wdt:P2716'
]

avatarUrls =
  'wdt:P2002': (id)-> "https://twitter.com/#{id}/profile_image?size=original"
  'wdt:P2013': (id)-> "https://graph.facebook.com/#{id}/picture?type=large"

avatarProperties = Object.keys avatarUrls

aggregateAvatars = (claims)-> (array, property)->
  websiteUserId = claims[property]?[0]
  if websiteUserId then array.push avatarUrls[property](websiteUserId)
  return array
