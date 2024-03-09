import { objectEntries } from '#lib/utils/base'

const encodeCharacter = character => `%${character.charCodeAt(0).toString(16)}`

export const stringifyQuery = query => new URLSearchParams(query).toString()

export const parseQuery = query => Object.fromEntries(new URLSearchParams(query))

// encodeURIComponent ignores !, ', (, ), and *
// cf https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#Description
export function fixedEncodeURIComponent (str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, encodeCharacter)
}

export function buildUrl (pathname, queryObj) {
  const queryEntries = objectEntries(queryObj).filter(hasNonEmptyValue)
  const queryString = new URLSearchParams(queryEntries)
  return queryString ? `${pathname}?${queryString}` : pathname
}

const hasNonEmptyValue = entry => entry[1] != null
