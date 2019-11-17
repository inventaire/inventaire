// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { parse: isbnParser } = require('isbn2').ISBN
const parse = require('./parse')
const wdLang = require('wikidata-lang')

// Removing any non-alpha numeric characters, especially '-' and spaces
const normalizeIsbn = text => text
// Remove hypens
.replace(/\W/g, '')
// Make sure any 'x' is an X
.toUpperCase()

const isNormalizedIsbn = text => /^(97(8|9))?\d{9}(\d|X)$/.test(text)

module.exports = {
  parse,
  normalizeIsbn,
  looksLikeAnIsbn: text => {
    if (typeof text !== 'string') return false
    const cleanedText = normalizeIsbn(text)
    if (isNormalizedIsbn(cleanedText)) {
      switch (cleanedText.length) {
      case 10: return 10; break
      case 13: return 13; break
      }
    }
    return false
  },
  isValidIsbn: isbn => (isbnParser(isbn) != null),
  toIsbn13: (isbn, hyphenate) => {
    const data = parse(isbn)
    if (data == null) return
    if (hyphenate) return data.isbn13h
    else return data.isbn13
  },

  toIsbn13h: isbn => parse(isbn).isbn13h,
  toIsbn10h: isbn => parse(isbn).isbn10h,

  guessLangFromIsbn: isbn => {
    const langUri = __guard__(parse(isbn), x => x.groupLangUri)
    if (langUri == null) return
    const wdId = langUri.split(':')[1]
    return (wdLang.byWdId[wdId] != null ? wdLang.byWdId[wdId].code : undefined)
  }
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}
