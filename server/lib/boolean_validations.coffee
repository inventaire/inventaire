# Keep in sync with client/app/lib/boolean_tests

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = require 'lodash'
regex_ = __.require 'lib', 'regex'
wdk = require 'wikidata-sdk'

bindedTest = (regexName)-> regex_[regexName].test.bind regex_[regexName]

isCouchUuid = regex_.CouchUuid.test.bind regex_.CouchUuid
isNonEmptyString = (str)-> _.isString(str) and str.length > 0

module.exports = tests =
  isUrl: bindedTest 'Url'
  isImageHash: bindedTest 'ImageHash'
  isLocalImg: bindedTest 'LocalImg'
  isAssetImg: bindedTest 'AssetImg'
  isUserImg: bindedTest 'UserImg'
  isLang: bindedTest 'Lang'
  isInvEntityId: isCouchUuid
  isInvEntityUri: (uri)->
    unless isNonEmptyString uri then return false
    [ prefix, id ] = uri?.split ':'
    return prefix is 'inv' and isCouchUuid(id)
  isWdEntityUri: (uri)->
    unless _.isNonEmptyString uri then return false
    [ prefix, id ] = uri?.split ':'
    return prefix is 'wd' and wdk.isItemId(id)
  isEmail: bindedTest 'Email'
  isUserId: isCouchUuid
  isGroupId: isCouchUuid
  isItemId: isCouchUuid
  isUsername: bindedTest 'Username'
  isEntityUri: bindedTest 'EntityUri'
  isExtendedEntityUri: (uri)->
    [ prefix, id ] = uri.split ':'
    # Accept alias URIs.
    # Ex: twitter:Bouletcorp -> wd:Q1524522
    return isNonEmptyString(prefix) and isNonEmptyString(id)
  isPropertyUri: bindedTest 'PropertyUri'
  isSimpleDay: (str)->
    isValidDate = false
    try
      # This line will throw if the date is invalid
      # Ex: '2018-03-32' or '2018-02-30'
      isoDate = (new Date(str)).toISOString()
      # Keep only the passed precision
      truncatedIsoDate = isoDate.slice(0, str.length)
      isValidDate = truncatedIsoDate is str
    catch err
      isValidDate = false

    return isValidDate and regex_.SimpleDay.test(str)
  isNonEmptyString: isNonEmptyString
  isNonEmptyArray: (array)-> _.isArray(array) and array.length > 0
  isNonEmptyPlainObject: (obj)-> _.isPlainObject(obj) and Object.keys(obj).length > 0
  isPositiveIntegerString: (str)-> _.isString(str) and /^\d+$/.test str
  isExtendedUrl: (str)-> tests.isUrl(str) or tests.isLocalImg(str)
  isCollection: (array)-> _.typeOf(array) is 'array' and _.every(array, _.isPlainObject)
