// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS103: Rewrite code to no longer use __guard__
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const isbn_ = __.require('lib', 'isbn/isbn')

// Inferences are property values deduced from another property
module.exports = {
  'wdt:P212': {
    'wdt:P957' (isbn13) { return __guard__(isbn_.parse(isbn13), x => x.isbn10h) },
    'wdt:P407' (isbn13) { return __guard__(isbn_.parse(isbn13), x => x.groupLangUri) }
  }
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}
