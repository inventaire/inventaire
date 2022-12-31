const extraEncodedCharacters = /[!'()*]/g
const encodeCharacter = character => `%${character.charCodeAt(0).toString(16)}`

export default {
  stringifyQuery: query => new URLSearchParams(query).toString(),

  parseQuery: query => Object.fromEntries(new URLSearchParams(query)),

  // encodeURIComponent ignores !, ', (, ), and *
  // cf https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#Description
  fixedEncodeURIComponent: str => {
    return encodeURIComponent(str).replace(extraEncodedCharacters, encodeCharacter)
  },

  buildUrl: (pathname, queryObj) => {
    const queryEntries = Object.entries(queryObj).filter(hasNonEmptyValue)
    const queryString = new URLSearchParams(queryEntries)
    return queryString ? `${pathname}?${queryString}` : pathname
  },
}

const hasNonEmptyValue = entry => entry[1] != null
