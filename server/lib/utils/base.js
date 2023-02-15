import _ from 'lodash-es'
import {
  Integer as integerPattern,
  PositiveInteger as PositiveIntegerPattern,
  Float as floatPattern,
} from '#lib/regex'
import { assert_ } from '#lib/utils/assert_types'

export const combinations = (array1, array2) => {
  return array1.flatMap(key1 => {
    return array2.map(key2 => [ key1, key2 ])
  })
}

export const sumValues = obj => _.sum(Object.values(obj))

export const sameObjects = (a, b) => JSON.stringify(a) === JSON.stringify(b)

export const toLowerCase = str => str.toLowerCase()

export const stringToInt = str => {
  if (typeof str !== 'string') throw new Error(`expected a string: ${str}`)
  // testing the validity of the string is needed
  // to avoid getting NaN from parseInt
  if (!integerPattern.test(str)) throw new Error(`invalid integer string: ${str}`)
  return parseInt(str)
}

export const parsePositiveInteger = str => {
  // /!\ Difference with parseInt: not throwing
  if ((typeof str !== 'string') || !PositiveIntegerPattern.test(str)) return
  return parseInt(str)
}

export const stringToFloat = str => {
  if (typeof str !== 'string') throw new Error(`expected a string: ${str}`)
  if (!floatPattern.test(str)) throw new Error(`invalid float string: ${str}`)
  return parseFloat(str)
}

export const isArrayLike = obj => _.isArray(obj) || _.isArguments(obj)

// Remove any superfluous spaces
export const superTrim = str => str.replaceAll(/\s+/g, ' ').trim()

export const KeyBy = attribute => array => _.keyBy(array, attribute)

export const uniqByKey = (collection, key) => {
  assert_.array(collection)
  assert_.string(key)
  return Object.values(_.keyBy(collection, key))
}

export const initCollectionsIndex = names => names.reduce(aggregateCollections, {})

export const obfuscate = str => str.replace(/./g, '*')

// adapted from http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
export const hashCode = string => {
  let [ hash, i, len ] = [ 0, 0, string.length ]
  if (len === 0) return hash

  while (i < len) {
    const chr = string.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0 // Convert to 32bit integer
    i++
  }
  return Math.abs(hash)
}

export const someMatch = (arrayA, arrayB) => {
  if (!_.isArray(arrayA) || !_.isArray(arrayB)) return false
  for (const valueA of arrayA) {
    for (const valueB of arrayB) {
      // Return true as soon as possible
      if (valueA === valueB) return true
    }
  }
  return false
}

export const objLength = obj => Object.keys(obj).length

export const expired = (timestamp, ttl) => (Date.now() - timestamp) > ttl

export const shortLang = lang => lang && lang.slice(0, 2)

export const pickOne = obj => {
  const key = Object.keys(obj)[0]
  if (key != null) return obj[key]
}

export const parseBooleanString = (booleanString, defaultVal = false) => {
  if (defaultVal === false) return booleanString === 'true'
  else return booleanString !== 'false'
}

export const simpleDay = date => {
  const dateObj = date != null ? new Date(date) : new Date()
  return dateObj.toISOString().split('T')[0]
}

// Helpers to simplify polymorphisms
export const forceArray = keys => {
  if (keys == null || keys === '') return []
  if (_.isArray(keys)) return keys
  else return [ keys ]
}

// Iterates on an object, with the passed function: fn(key, value)
// Expected returned value: [ newKey, newValue ]
export const mapKeysValues = (obj, fn) => {
  return Object.keys(obj).reduce(aggregateMappedKeysValues(obj, fn), {})
}

export const deepCompact = arrays => {
  return _(arrays)
  .flatten()
  .uniq()
  .compact()
  .value()
}

export const mapUniq = (collection, key) => {
  return _(collection)
  .map(key)
  .uniq()
  .value()
}

export const flatMapUniq = (collection, key) => {
  return _(collection)
  .map(key)
  .flatten()
  .uniq()
  .value()
}

// Decode first, so that any pre-encoded character isn't re-encoded
export const encodeURL = url => encodeURI(decodeURI(url))

export const isNotEmpty = value => value != null

export const normalizeString = str => str.trim().normalize()

const aggregateMappedKeysValues = (obj, fn) => (newObj, key) => {
  const value = obj[key]
  const newKeyValue = fn(key, value)

  if (!_.isArray(newKeyValue)) {
    const errMessage = `function should return a [ key, value ] array (got ${newKeyValue})`
    throw new Error(errMessage)
  }

  const [ newKey, newValue ] = newKeyValue

  if (newKey == null) throw new Error(`missing new key (old key: ${key})`)
  if (newValue == null) throw new Error(`missing new value (old value: ${value})`)

  newObj[newKey] = newValue
  return newObj
}

const aggregateCollections = (index, name) => {
  index[name] = []
  return index
}
