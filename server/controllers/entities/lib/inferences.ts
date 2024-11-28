import { parseIsbn } from '#lib/isbn/parse'
import type { InvClaimValue, PropertyUri } from '#types/entity'

export type InferedProperties = Record<PropertyUri, (InvClaimValue) => InvClaimValue | null>
export type PropertyInferences = Record<PropertyUri, InferedProperties>

// Inferences are property values deduced from another property
export const inferences: PropertyInferences = {
  'wdt:P212': {
    'wdt:P957': (isbn13: string) => {
      const isbnData = parseIsbn(isbn13)
      return isbnData ? isbnData.isbn10h : null
    },
    'wdt:P407': (isbn13: string) => {
      const isbnData = parseIsbn(isbn13)
      return isbnData ? isbnData.groupLangUri : null
    },
  },
}
