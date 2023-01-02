// Keep in sync with client/app/lib/boolean_tests
import CONFIG from 'config'
import { isArray, isPlainObject, isString } from 'lodash-es'
import wdk from 'wikidata-sdk'
import * as regex_ from '#lib/regex'
import { isNormalizedIsbn } from './isbn/isbn.js'

const { PositiveInteger: PositiveIntegerPattern } = regex_
const publicOrigin = CONFIG.getPublicOrigin()

const bindedTest = regexName => regex_[regexName].test.bind(regex_[regexName])

export const isCouchUuid = regex_.CouchUuid.test.bind(regex_.CouchUuid)
export const isNonEmptyString = str => typeof str === 'string' && str.length > 0

export const isUrl = url => {
  try {
    const { protocol, username, password } = new URL(url)
    if (!(protocol === 'http:' || protocol === 'https:')) return false
    if (username !== '' || password !== '') return false
  } catch (err) {
    if (err.code === 'ERR_INVALID_URL') return false
    else throw err
  }
  return true
}
export const isColorHexCode = bindedTest('ColorHexCode')
export const isImageHash = bindedTest('ImageHash')
export const isAssetImg = bindedTest('AssetImg')
export const isEntityImg = bindedTest('EntityImg')
export const isGroupImg = bindedTest('GroupImg')
export const isLocalImg = bindedTest('LocalImg')
export const isUserImg = bindedTest('UserImg')
export const isLang = bindedTest('Lang')
export const isInvEntityId = isCouchUuid
export const isInvEntityUri = uri => {
  if (!isNonEmptyString(uri)) return false
  const [ prefix, id ] = uri && uri.split(':')
  return (prefix === 'inv') && isCouchUuid(id)
}
export const isIsbnEntityUri = uri => {
  if (!isNonEmptyString(uri)) return false
  const [ prefix, id ] = uri && uri.split(':')
  return (prefix === 'isbn') && isNormalizedIsbn(id)
}
export const isWdEntityUri = uri => {
  if (!isNonEmptyString(uri)) return false
  const [ prefix, id ] = uri && uri.split(':')
  return (prefix === 'wd') && wdk.isItemId(id)
}
export const isEntityId = id => wdk.isItemId(id) || isInvEntityId(id)
export const isEmail = bindedTest('Email')
export const isUserId = isCouchUuid
export const isTransactionId = isCouchUuid
export const isGroupId = isCouchUuid
export const isItemId = isCouchUuid
export const isUsername = bindedTest('Username')
export const isEntityUri = bindedTest('EntityUri')
export const isPatchId = bindedTest('PatchId')
export const isPropertyUri = bindedTest('PropertyUri')
export const isExtendedEntityUri = uri => {
  const [ prefix, id ] = uri.split(':')
  // Accept alias URIs.
  // Ex: twitter:Bouletcorp -> wd:Q1524522
  return isNonEmptyString(prefix) && isNonEmptyString(id)
}
export const isSimpleDay = str => {
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
}
export const isNonEmptyArray = array => isArray(array) && (array.length > 0)
export const isNonEmptyPlainObject = obj => isPlainObject(obj) && (Object.keys(obj).length > 0)
export const isPositiveIntegerString = str => isString(str) && PositiveIntegerPattern.test(str)
export const isStrictlyPositiveInteger = num => Number.isInteger(num) && num > 0
export const isExtendedUrl = str => isUrl(str) || isLocalImg(str)
export const isCollection = array => isArray(array) && array.every(isPlainObject)

export const isLocalActivityPubActorUrl = url => {
  if (!isUrl(url)) return false
  const { origin, pathname, searchParams } = new URL(url)
  if (origin !== publicOrigin) return false
  if (pathname !== '/api/activitypub') return false
  if (searchParams.get('action') !== 'actor') return false
  return isNonEmptyString(searchParams.get('name'))
}

export const isVisibilityGroupKey = value => {
  const [ prefix, id ] = value.split(':')
  return prefix === 'group' && isCouchUuid(id)
}
