_ = require 'lodash'

avatarData = (platform, id)->
  url: "https://avatars.io/#{platform}/#{id}"
  credits:
    text: _.capitalize(platform) + ' profil picture'
    url: "https://#{platform}.com/#{id}"

platforms =
  'wdt:P2002': 'twitter'
  'wdt:P2003': 'instagram'
  'wdt:P2013': 'facebook'

platformsProperties = Object.keys platforms

aggregateAvatars = (claims)-> (array, property)->
  websiteUserId = claims[property]?[0]
  if websiteUserId
    platform = platforms[property]
    array.push avatarData(platform, websiteUserId)
  return array

getAvatarsFromClaims = (claims)->
  platformsProperties.reduce aggregateAvatars(claims), []

module.exports =
  getAvatarsDataFromClaims: getAvatarsFromClaims
  getAvatarsUrlsFromClaims: (claims)->
    getAvatarsFromClaims claims
    .map _.property('url')
