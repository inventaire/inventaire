// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const { parse: isbnParser } = require('isbn3')
const parse = require('./parse')
const wdLang = require('wikidata-lang')

// Removing any non-alpha numeric characters, especially '-' and spaces
const normalizeIsbn = text => {
  return text
  // Remove hypens
  .replace(/\W/g, '')
  // Make sure any 'x' is an X
  .toUpperCase()
}

const isNormalizedIsbn = text => /^(97(8|9))?\d{9}(\d|X)$/.test(text)

module.exports = {
  parse,
  normalizeIsbn,
  looksLikeAnIsbn: text => {
    if (typeof text !== 'string') return false
    const cleanedText = normalizeIsbn(text)
    if (isNormalizedIsbn(cleanedText)) {
      if (cleanedText.length === 10) return 10
      if (cleanedText.length === 13) return 13
    }
    return false
  },
  isValidIsbn: isbn => isbnParser(isbn) != null,
  toIsbn13: (isbn, hyphenate) => {
    const data = parse(isbn)
    if (data == null) return
    if (hyphenate) return data.isbn13h
    else return data.isbn13
  },

  toIsbn13h: isbn => parse(isbn).isbn13h,
  toIsbn10h: isbn => parse(isbn).isbn10h,

  guessLangFromIsbn: isbn => {
    if (!isbn) return
    const isbnData = parse(isbn)
    if (isbnData == null) return
    const langUri = isbnData.groupLangUri
    if (langUri == null) return
    const wdId = langUri.split(':')[1]
    const wdLangData = wdLang.byWdId[wdId]
    if (wdLangData) return wdLangData.code
  }
}
