_ = require 'lodash'

avatarData =
  'wdt:P2002': (id)->
    url: "https://twitter.com/#{id}/profile_image?size=original"
    credits:
      text: 'Twitter profil picture'
      url: "https://twitter.com/#{id}"
  'wdt:P2013': (id)->
    url: "https://graph.facebook.com/#{id}/picture?type=large"
    credits:
      text: 'Facebook profil picture'
      url: "https://facebook.com/#{id}"

avatarProperties = Object.keys avatarData

aggregateAvatars = (claims)-> (array, property)->
  websiteUserId = claims[property]?[0]
  if websiteUserId then array.push avatarData[property](websiteUserId)
  return array

getAvatarsFromClaims = (claims)-> avatarProperties.reduce aggregateAvatars(claims), []

module.exports =
  getAvatarsDataFromClaims: getAvatarsFromClaims
  getAvatarsUrlsFromClaims: (claims)->
    getAvatarsFromClaims claims
    .map _.property('url')
