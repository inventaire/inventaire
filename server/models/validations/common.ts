import { isArray, isBoolean, isNumber, isObject, isString } from 'lodash-es'
import { isCouchUuid, isEmail, isEntityUri, isGroupId, isImageHash, isItemId, isLang, isLocalImg, isPatchId, isTransactionId, isUrl, isUserId, isUserImg, isUsername } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { newInvalidError } from '#lib/error/pre_filled'

const validations = {
  attribute: isString,
  boolean: isBoolean,
  couchUuid: isCouchUuid,
  'doc _id': isCouchUuid,
  email: isEmail,
  entityUri: isEntityUri,
  groupId: isGroupId,
  itemId: isItemId,
  lang: isLang,
  localImg: isLocalImg,
  position: latLng => {
    // Allow a user or a group to delete their position by passing a null value
    if (latLng === null) return true
    else return isArray(latLng) && (latLng.length === 2) && latLng.every(isNumber)
  },
  patchId: isPatchId,
  transactionId: isTransactionId,
  userId: isUserId,
  userImg: image => {
    // Allow a user to delete their picture by passing a null value
    if (image === null) return true
    else return isUserImg(image)
  },
  username: isUsername,
  shelves: shelves => isArray(shelves) && shelves.every(isCouchUuid),
}

export default validations

export const boundedString = (str, minLength, maxLength) => {
  return isString(str) && (minLength <= str.length && str.length <= maxLength)
}

export const BoundedString = (minLength, maxLength) => str => {
  return validations.boundedString(str, minLength, maxLength)
}

validations.boundedString = boundedString
validations.BoundedString = BoundedString

validations.imgUrl = url => validations.localImg(url) || isUrl(url) || isImageHash(url)

validations.valid = function (attribute, value, option) {
  let test = this[attribute]
  // if no test are set at this attribute for this context
  // default to common validations
  if (test == null) test = validations[attribute]
  if (test == null) throw newError('missing validation function', 500, { attribute, context: this })
  return test(value, option)
}

validations.pass = function (attribute, value, option) {
  if (!validations.valid.call(this, attribute, value, option)) {
    if (isObject(value)) value = JSON.stringify(value)
    throw newInvalidError(attribute, value)
  }
}
