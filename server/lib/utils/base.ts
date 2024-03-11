import { chain, isArguments, isArray, keyBy, sum } from 'lodash-es'
import {
  Integer as integerPattern,
  PositiveInteger as PositiveIntegerPattern,
  Float as floatPattern,
} from '#lib/regex'
import { assert_ } from '#lib/utils/assert_types'
import type { ObjectEntries } from 'type-fest/source/entries.js'

export function combinations (array1, array2) {
  return array1.flatMap(key1 => {
    return array2.map(key2 => [ key1, key2 ])
  })
}

export const sumValues = obj => sum(Object.values(obj))

export const sameObjects = (a, b) => JSON.stringify(a) === JSON.stringify(b)

export const toLowerCase = str => str.toLowerCase()

export function stringToInt (str) {
  if (typeof str !== 'string') throw new Error(`expected a string: ${str}`)
  // testing the validity of the string is needed
  // to avoid getting NaN from parseInt
  if (!integerPattern.test(str)) throw new Error(`invalid integer string: ${str}`)
  return parseInt(str)
}

export function parsePositiveInteger (str) {
  // /!\ Difference with parseInt: not throwing
  if ((typeof str !== 'string') || !PositiveIntegerPattern.test(str)) return
  return parseInt(str)
}

export function stringToFloat (str) {
  if (typeof str !== 'string') throw new Error(`expected a string: ${str}`)
  if (!floatPattern.test(str)) throw new Error(`invalid float string: ${str}`)
  return parseFloat(str)
}

export const isArrayLike = obj => isArray(obj) || isArguments(obj)

// Remove any superfluous spaces
export const superTrim = str => str.replaceAll(/\s+/g, ' ').trim()

export const KeyBy = attribute => array => keyBy(array, attribute)

export function uniqByKey<T> (collection, key) {
  assert_.array(collection)
  assert_.string(key)
  return Object.values(keyBy(collection, key)) as T[]
}

export const initCollectionsIndex = names => names.reduce(aggregateCollections, {})

export const obfuscate = str => str.replace(/./g, '*')

// adapted from http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
export function getHashCode (string) {
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

export function someMatch (arrayA, arrayB) {
  if (!isArray(arrayA) || !isArray(arrayB)) return false
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

export function pickOne (obj) {
  const key = Object.keys(obj)[0]
  if (key != null) return obj[key]
}

export const parseBooleanString = (booleanString, defaultVal = false) => {
  if (defaultVal === false) return booleanString === 'true'
  else return booleanString !== 'false'
}

export function simpleDay (date?: Date | EpochTimeStamp) {
  const dateObj = date != null ? new Date(date) : new Date()
  return dateObj.toISOString().split('T')[0]
}

// Helpers to simplify polymorphisms
export function forceArray (keys) {
  if (keys == null || keys === '') return []
  if (isArray(keys)) return keys
  else return [ keys ]
}

// Iterates on an object, with the passed function: fn(key, value)
// Expected returned value: [ newKey, newValue ]
export function mapKeysValues (obj, fn) {
  return Object.keys(obj).reduce(aggregateMappedKeysValues(obj, fn), {})
}

export function deepCompact (arrays) {
  return chain(arrays)
  .flatten()
  .uniq()
  .compact()
  .value()
}

export function mapUniq (collection, key) {
  return chain(collection)
  .map(key)
  .uniq()
  .value()
}

export function flatMapUniq (collection, key) {
  return chain(collection)
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

  if (!isArray(newKeyValue)) {
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

// Work around the TS2345 error when using Array include method
// https://stackoverflow.com/questions/55906553/typescript-unexpected-error-when-using-includes-with-a-typed-array/70532727#70532727
export const arrayIncludes = (array, value) => array.some(element => element === value) != null

export const objectEntries = obj => Object.entries(obj) as ObjectEntries<typeof obj>

/** Returns a new object with keys and values inverted */
export function invert (obj: Record<string | number, string | number>) {
  const invertedObj = {}
  for (const [ key, value ] of Object.entries(obj) as ObjectEntries<typeof obj>) {
    invertedObj[value] = key
  }
  return invertedObj
}
