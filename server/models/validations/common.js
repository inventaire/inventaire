// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let boundedString, validations
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const regex_ = __.require('lib', 'regex')
const error_ = __.require('lib', 'error/error')

const { CouchUuid, Email, Username, EntityUri, Lang, LocalImg, UserImg } = regex_

// regex need to their context
const bindedTest = regex => regex.test.bind(regex)

const couchUuid = bindedTest(CouchUuid)

module.exports = (validations = {
  couchUuid,
  userId: couchUuid,
  itemId: couchUuid,
  transactionId: couchUuid,
  groupId: couchUuid,
  username: bindedTest(Username),
  email: bindedTest(Email),
  entityUri: bindedTest(EntityUri),
  lang: bindedTest(Lang),
  localImg: bindedTest(LocalImg),
  userImg: bindedTest(UserImg),
  boolean: _.isBoolean,
  position: latLng => {
    // allow the user or group to delete its position by passing a null value
    if (latLng === null) return true
    return _.isArray(latLng) && (latLng.length === 2) && _.every(latLng, _.isNumber)
  }
})

validations.boundedString = (boundedString = (str, minLength, maxLength) => _.isString(str) && (minLength <= str.length && str.length <= maxLength))

validations.BoundedString = (minLength, maxLength) => str => boundedString(str, minLength, maxLength)

validations.imgUrl = url => validations.localImg(url) || _.isUrl(url) || _.isImageHash(url)

validations.valid = (attribute, value, option) => {
  let test = this[attribute]
  // if no test are set at this attribute for this context
  // default to common validations
  if (test == null) { test = validations[attribute] }
  return test(value, option)
}

validations.pass = (attribute, value, option) => {
  if (!validations.valid.call(this, attribute, value, option)) {
    if (_.isObject(value)) { value = JSON.stringify(value) }
    throw error_.newInvalid(attribute, value)
  }
}
