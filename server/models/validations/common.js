const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const error_ = require('lib/error/error')

const validations = module.exports = {
  couchUuid: _.isCouchUuid,
  'doc _id': _.isCouchUuid,
  userId: _.isUserId,
  itemId: _.isItemId,
  transactionId: _.isTransactionId,
  groupId: _.isGroupId,
  username: _.isUsername,
  email: _.isEmail,
  entityUri: _.isEntityUri,
  lang: _.isLang,
  localImg: _.isLocalImg,
  userImg: image => {
    // Allow a user to delete their picture by passing a null value
    if (image === null) return true
    else return _.isUserImg(image)
  },
  boolean: _.isBoolean,
  attribute: _.isString,
  shelves: shelves => _.isArray(shelves) && _.every(shelves, _.isCouchUuid),
  position: latLng => {
    // Allow a user or a group to delete their position by passing a null value
    if (latLng === null) return true
    else return _.isArray(latLng) && (latLng.length === 2) && _.every(latLng, _.isNumber)
  },
  patchId: _.isPatchId
}

validations.boundedString = (str, minLength, maxLength) => {
  return _.isString(str) && (minLength <= str.length && str.length <= maxLength)
}

validations.BoundedString = (minLength, maxLength) => str => {
  return validations.boundedString(str, minLength, maxLength)
}

validations.imgUrl = url => validations.localImg(url) || _.isUrl(url) || _.isImageHash(url)

validations.valid = function (attribute, value, option) {
  let test = this[attribute]
  // if no test are set at this attribute for this context
  // default to common validations
  if (test == null) test = validations[attribute]
  if (test == null) throw error_.new('missing validation function', 500, { attribute, context: this })
  return test(value, option)
}

validations.pass = function (attribute, value, option) {
  if (!validations.valid.call(this, attribute, value, option)) {
    if (_.isObject(value)) value = JSON.stringify(value)
    throw error_.newInvalid(attribute, value)
  }
}
