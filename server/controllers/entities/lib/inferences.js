
const CONFIG = require('config')
const __ = CONFIG.universalPath
const isbn_ = __.require('lib', 'isbn/isbn')

// Inferences are property values deduced from another property
module.exports = {
  'wdt:P212': {
    'wdt:P957': isbn13 => {
      const isbnData = isbn_.parse(isbn13)
      return isbnData ? isbnData.isbn10h : null
    },
    'wdt:P407': isbn13 => {
      const isbnData = isbn_.parse(isbn13)
      return isbnData ? isbnData.groupLangUri : null
    }
  }
}
