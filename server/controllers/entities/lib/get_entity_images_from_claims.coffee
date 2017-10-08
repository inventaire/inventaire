__ = require('config').universalPath
_ = __.require 'builders', 'utils'

imageClaims = [
  # image
  'wdt:P18'
  # logo image
  'wdt:P154'
  # collage image
  'wdt:P2716'
]

module.exports = (entity)->
  { claims } = entity
  # Test claims existance to prevent crash when used on meta entities
  # for which entities claims were deleted
  unless claims? then return []

  images = _.flatten _.values(_.pick(claims, imageClaims))

  twitterAvatar = getTwitterAvatar claims
  if twitterAvatar? then images.push twitterAvatar

  return images

getTwitterAvatar = (claims)->
  username = claims['wdt:P2002']?[0]
  unless username? then return
  return "https://twitter.com/#{username}/profile_image?size=original"
