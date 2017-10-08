module.exports = (entity)->
  { claims } = entity
  # Test claims existance to prevent crash when used on meta entities
  # for which entities claims were deleted
  unless claims? then return

  # Alyways return an array
  return [].concat claims['wdt:P18'], getTwitterAvatar(claims)

getTwitterAvatar = (claims)->
  username = claims['wdt:P2002']?[0]
  unless username? then return
  return "https://twitter.com/#{username}/profile_image?size=original"
