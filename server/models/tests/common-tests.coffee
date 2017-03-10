CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
regex_ = require './regex'
error_ = __.require 'lib', 'error/error'

{ CouchUuid, Email, Username, EntityUri, Lang, LocalImg } = regex_

# regex need to their context
bindedTest = (regex)-> regex.test.bind regex

couchUuid = bindedTest CouchUuid

module.exports = tests =
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
  boolean: _.isBoolean
  position: (latLng)->
    # allow the user or group to delete its position by passing a null value
    if latLng is null then return true
    _.isArray(latLng) and latLng.length is 2 and _.all latLng, _.isNumber

limitedString = (str, minLength, maxLength)->
  return _.isString(str) and minLength <= str.length <= maxLength

tests.underLimitString = (str, maxLength)-> limitedString str, 0, maxLength
tests.nonEmptyString = (str, maxLength=100)-> limitedString str, 1, maxLength

# no item of this app could have a timestamp before june 2014
June2014 = 1402351200000
tests.EpochMs =
  test: (time)-> June2014 < time <= Date.now()

tests.imgUrl = (url)-> tests.localImg(url) or _.isUrl(url) or _.isIpfsPath(url)

tests.valid = (attribute, value, option)->
  test = @[attribute]
  # if no test are set at this attribute for this context
  # default to common tests
  test ?= tests[attribute]
  test value, option

tests.pass = (attribute, value, option)->
  unless tests.valid.call @, attribute, value, option
    if _.isObject value then value = JSON.stringify value
    throw error_.newInvalid attribute, value

tests.type = (attribute, typeArgs...)->
  try _.type.apply _, typeArgs
  catch err
    throw error_.complete err, "invalid #{attribute}", 400, typeArgs

tests.types = (attribute, typesArgs...)->
  try _.types.apply _, typesArgs
  catch err
    throw error_.complete err, "invalid #{attribute}", 400, typesArgs
