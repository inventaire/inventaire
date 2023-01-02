import { parseIsbn } from '#lib/isbn/parse'

// Inferences are property values deduced from another property
export default {
  'wdt:P212': {
    'wdt:P957': isbn13 => {
      const isbnData = parseIsbn(isbn13)
      return isbnData ? isbnData.isbn10h : null
    },
    'wdt:P407': isbn13 => {
      const isbnData = parseIsbn(isbn13)
      return isbnData ? isbnData.groupLangUri : null
    }
  }
}
