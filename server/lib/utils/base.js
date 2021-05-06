// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const _ = require('lodash')
const multipleSpacesPattern = /\s+/g
const extraEncodedCharacters = /[!'()*]/g
const {
  Integer: integerPattern,
  PositiveInteger: PositiveIntegerPattern,
  Float: floatPattern
} = require('lib/regex')

module.exports = {
  combinations: (array1, array2) => {
    const results = []
    array1.forEach(keys1 => {
      array2.forEach(keys2 => {
        results.push([ keys1, keys2 ])
      })
    })
    return results
  },

  sumValues: obj => _.sum(_.values(obj)),

  sameObjects: (a, b) => JSON.stringify(a) === JSON.stringify(b),

  toLowerCase: str => str.toLowerCase(),

  stringToInt: str => {
    if (typeof str !== 'string') throw new Error(`expected a string: ${str}`)
    // testing the validity of the string is needed
    // to avoid getting NaN from parseInt
    if (!integerPattern.test(str)) throw new Error(`invalid integer string: ${str}`)
    return parseInt(str)
  },

  parsePositiveInteger: str => {
    // /!\ Difference with parseInt: not throwing
    if ((typeof str !== 'string') || !PositiveIntegerPattern.test(str)) return
    return parseInt(str)
  },

  stringToFloat: str => {
    if (typeof str !== 'string') throw new Error(`expected a string: ${str}`)
    if (!floatPattern.test(str)) throw new Error(`invalid float string: ${str}`)
    return parseFloat(str)
  },

  isArrayLike: obj => _.isArray(obj) || _.isArguments(obj),

  // Remove any superfluous spaces
  superTrim: str => str.replace(multipleSpacesPattern, ' ').trim(),

  KeyBy: attribute => array => _.keyBy(array, attribute),

  initCollectionsIndex: names => names.reduce(aggregateCollections, {}),

  obfuscate: str => str.replace(/.{1}/g, '*'),

  // adapted from http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  hashCode: string => {
    let [ hash, i, len ] = [ 0, 0, string.length ]
    if (len === 0) return hash

    while (i < len) {
      const chr = string.charCodeAt(i)
      hash = ((hash << 5) - hash) + chr
      hash |= 0 // Convert to 32bit integer
      i++
    }
    return Math.abs(hash)
  },

  buildPath: (pathname, queryObj, escape) => {
    queryObj = removeUndefined(queryObj)
    if (queryObj == null || _.isEmpty(queryObj)) return pathname

    let queryString = ''

    for (const key in queryObj) {
      let value = queryObj[key]
      if (escape) {
        value = dropSpecialCharacters(value)
      }
      if (_.isObject(value)) {
        value = escapeQueryStringValue(JSON.stringify(value))
      }
      queryString += `&${key}=${value}`
    }

    return `${pathname}?${queryString.slice(1)}`
  },

  someMatch: (arrayA, arrayB) => {
    if (!_.isArray(arrayA) || !_.isArray(arrayB)) return false
    for (const valueA of arrayA) {
      for (const valueB of arrayB) {
        // Return true as soon as possible
        if (valueA === valueB) return true
      }
    }
    return false
  },

  objLength: obj => _.keys(obj).length,

  expired: (timestamp, ttl) => (Date.now() - timestamp) > ttl,

  shortLang: lang => lang && lang.slice(0, 2),

  // encodeURIComponent ignores !, ', (, ), and *
  // cf https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#Description
  fixedEncodeURIComponent: str => {
    return encodeURIComponent(str).replace(extraEncodedCharacters, encodeCharacter)
  },

  pickOne: obj => {
    const key = Object.keys(obj)[0]
    if (key != null) return obj[key]
  },

  parseBooleanString: (booleanString, defaultVal = false) => {
    if (defaultVal === false) return booleanString === 'true'
    else return booleanString !== 'false'
  },

  simpleDay: date => {
    const dateObj = date != null ? new Date(date) : new Date()
    return dateObj.toISOString().split('T')[0]
  },

  typeOf: obj => {
    // just handling what differes from typeof
    const type = typeof obj
    if (type === 'object') {
      if (_.isNull(obj)) return 'null'
      if (_.isArray(obj)) return 'array'
      if (obj instanceof Promise) return 'promise'
    }
    if (type === 'number') {
      if (_.isNaN(obj)) return 'NaN'
    }
    return type
  },

  // Helpers to simplify polymorphisms
  forceArray: keys => {
    if (keys == null || keys === '') return []
    if (_.isArray(keys)) return keys
    else return [ keys ]
  },

  // Iterates on an object, with the passed function: fn(key, value)
  // Expected returned value: [ newKey, newValue ]
  mapKeysValues: (obj, fn) => {
    return Object.keys(obj).reduce(aggregateMappedKeysValues(obj, fn), {})
  },

  deepCompact: arrays => {
    return _(arrays)
    .flatten()
    .uniq()
    .compact()
    .value()
  },

  // Decode first, so that any pre-encoded character isn't re-encoded
  encodeURL: url => encodeURI(decodeURI(url)),
}

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

const encodeCharacter = character => `%${character.charCodeAt(0).toString(16)}`

const removeUndefined = obj => {
  const newObj = {}
  for (const key in obj) {
    const value = obj[key]
    if (value != null) newObj[key] = value
  }
  return newObj
}

const specialCharactersPattern = /(\?|:)/g
const dropSpecialCharacters = str => {
  return str
  .replace(multipleSpacesPattern, ' ')
  .replace(specialCharactersPattern, '')
}

// Only escape values that are problematic in a query string:
// for the moment, only '?'
const questionMarks = /\?/g
const escapeQueryStringValue = str => str.replace(questionMarks, '%3F')

const aggregateCollections = (index, name) => {
  index[name] = []
  return index
}
