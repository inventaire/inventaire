import { objectEntries } from '#lib/utils/base'
import type { Url } from '#server/types/common'

const encodeCharacter = character => `%${character.charCodeAt(0).toString(16)}`

export const stringifyQuery = query => new URLSearchParams(query).toString()

export const parseQuery = query => Object.fromEntries(new URLSearchParams(query))

// encodeURIComponent ignores !, ', (, ), and *
// cf https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#Description
export function fixedEncodeURIComponent (str: string) {
  return encodeURIComponent(str).replace(/[!'()*]/g, encodeCharacter)
}

export function buildUrl <T extends Url> (pathname: T, queryObj: Record<string, unknown>) {
  const queryEntries = objectEntries(queryObj).filter(hasNonEmptyValue)
  const queryString = new URLSearchParams(queryEntries)
  return (queryString ? `${pathname}?${queryString}` : pathname) as T
}

const hasNonEmptyValue = entry => entry[1] != null
