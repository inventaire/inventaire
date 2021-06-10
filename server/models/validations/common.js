const _ = require('builders/utils')
const error_ = require('lib/error/error')

const validations = module.exports = {
  attribute: _.isString,
  boolean: _.isBoolean,
  couchUuid: _.isCouchUuid,
  'doc _id': _.isCouchUuid,
  email: _.isEmail,
  entityUri: _.isEntityUri,
  groupId: _.isGroupId,
  itemId: _.isItemId,
  lang: _.isLang,
  localImg: _.isLocalImg,
  position: latLng => {
    // Allow a user or a group to delete their position by passing a null value
    if (latLng === null) return true
    else return _.isArray(latLng) && (latLng.length === 2) && _.every(latLng, _.isNumber)
  },
  patchId: _.isPatchId,
  transactionId: _.isTransactionId,
  userId: _.isUserId,
  userImg: image => {
    // Allow a user to delete their picture by passing a null value
    if (image === null) return true
    else return _.isUserImg(image)
  },
  username: _.isUsername,
  shelves: shelves => _.isArray(shelves) && _.every(shelves, _.isCouchUuid),
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
