const { isEmpty, isObject } = require('lodash')
const extraEncodedCharacters = /[!'()*]/g
const encodeCharacter = character => `%${character.charCodeAt(0).toString(16)}`

module.exports = {
  stringifyQuery: query => new URLSearchParams(query).toString(),

  parseQuery: query => Object.fromEntries(new URLSearchParams(query)),

  // encodeURIComponent ignores !, ', (, ), and *
  // cf https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#Description
  fixedEncodeURIComponent: str => {
    return encodeURIComponent(str).replace(extraEncodedCharacters, encodeCharacter)
  },

  buildUrl: (pathname, queryObj, escape) => {
    queryObj = removeUndefined(queryObj)
    if (queryObj == null || isEmpty(queryObj)) return pathname

    let queryString = ''

    for (const key in queryObj) {
      let value = queryObj[key]
      if (escape) {
        value = dropSpecialCharacters(value)
      }
      if (isObject(value)) {
        value = escapeQueryStringValue(JSON.stringify(value))
      }
      queryString += `&${key}=${value}`
    }

    return `${pathname}?${queryString.slice(1)}`
  },
}

const removeUndefined = obj => {
  const newObj = {}
  for (const key in obj) {
    const value = obj[key]
    if (value != null) newObj[key] = value
  }
  return newObj
}

const multipleSpacesPattern = /\s+/g
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
