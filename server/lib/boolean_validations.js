// Keep in sync with client/app/lib/boolean_tests
const _ = require('lodash')
const wdk = require('wikidata-sdk')
const regex_ = require('lib/regex')
const { PositiveInteger: PositiveIntegerPattern } = regex_

const bindedTest = regexName => regex_[regexName].test.bind(regex_[regexName])

const isCouchUuid = regex_.CouchUuid.test.bind(regex_.CouchUuid)
const isNonEmptyString = str => typeof str === 'string' && str.length > 0

const tests = module.exports = {
  isUrl: bindedTest('Url'),
  isImageHash: bindedTest('ImageHash'),
  isLocalImg: bindedTest('LocalImg'),
  isAssetImg: bindedTest('AssetImg'),
  isUserImg: bindedTest('UserImg'),
  isLang: bindedTest('Lang'),
  isInvEntityId: isCouchUuid,
  isInvEntityUri: uri => {
    if (!isNonEmptyString(uri)) return false
    const [ prefix, id ] = uri && uri.split(':')
    return (prefix === 'inv') && isCouchUuid(id)
  },
  isWdEntityUri: uri => {
    if (!isNonEmptyString(uri)) return false
    const [ prefix, id ] = uri && uri.split(':')
    return (prefix === 'wd') && wdk.isItemId(id)
  },
  isEmail: bindedTest('Email'),
  isCouchUuid,
  isUserId: isCouchUuid,
  isTransactionId: isCouchUuid,
  isGroupId: isCouchUuid,
  isItemId: isCouchUuid,
  isUsername: bindedTest('Username'),
  isEntityUri: bindedTest('EntityUri'),
  isPatchId: bindedTest('PatchId'),
  isPropertyUri: bindedTest('PropertyUri'),
  isExtendedEntityUri: uri => {
    const [ prefix, id ] = uri.split(':')
    // Accept alias URIs.
    // Ex: twitter:Bouletcorp -> wd:Q1524522
    return isNonEmptyString(prefix) && isNonEmptyString(id)
  },
  isSimpleDay: str => {
    let isValidDate = false
    try {
      // This line will throw if the date is invalid
      // Ex: '2018-03-32' or '2018-02-30'
      const isoDate = (new Date(str)).toISOString()
      // Keep only the passed precision
      const truncatedIsoDate = isoDate.slice(0, str.length)
      isValidDate = truncatedIsoDate === str
    } catch (err) {
      isValidDate = false
    }

    return isValidDate && regex_.SimpleDay.test(str)
  },
  isNonEmptyString,
  isNonEmptyArray: array => _.isArray(array) && (array.length > 0),
  isNonEmptyPlainObject: obj => _.isPlainObject(obj) && (Object.keys(obj).length > 0),
  isPositiveIntegerString: str => _.isString(str) && PositiveIntegerPattern.test(str),
  isStrictlyPositiveInteger: num => Number.isInteger(num) && num > 0,
  isExtendedUrl: str => tests.isUrl(str) || tests.isLocalImg(str),
  isCollection: array => (_.typeOf(array) === 'array') && _.every(array, _.isPlainObject)
}
