CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
regex_ = __.require 'lib', 'regex'
error_ = __.require 'lib', 'error/error'

{ CouchUuid, Email, Username, EntityUri, Lang, LocalImg, UserImg } = regex_

# regex need to their context
bindedTest = (regex)-> regex.test.bind regex

couchUuid = bindedTest CouchUuid

module.exports = validations =
  couchUuid: couchUuid
  userId: couchUuid
  itemId: couchUuid
  transactionId: couchUuid
  groupId: couchUuid
  username: bindedTest Username
  email: bindedTest Email
  entityUri: bindedTest EntityUri
  lang: bindedTest Lang
  localImg: bindedTest LocalImg
  userImg: bindedTest UserImg
  boolean: _.isBoolean
  position: (latLng)->
    # allow the user or group to delete its position by passing a null value
    if latLng is null then return true
    _.isArray(latLng) and latLng.length is 2 and _.every latLng, _.isNumber

validations.boundedString = boundedString = (str, minLength, maxLength)->
  return _.isString(str) and minLength <= str.length <= maxLength

validations.BoundedString = (minLength, maxLength)-> (str)->
  boundedString str, minLength, maxLength

validations.imgUrl = (url)-> validations.localImg(url) or _.isUrl(url) or _.isImageHash(url)

validations.valid = (attribute, value, option)->
  test = @[attribute]
  # if no test are set at this attribute for this context
  # default to common validations
  test ?= validations[attribute]
  test value, option

validations.pass = (attribute, value, option)->
  unless validations.valid.call @, attribute, value, option
    if _.isObject value then value = JSON.stringify value
    throw error_.newInvalid attribute, value
