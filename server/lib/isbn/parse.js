/* eslint-disable
    prefer-const,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let parse
const { parse: isbnParser } = require('isbn2').ISBN
const groups = require('./groups')

module.exports = (parse = function(isbn){
  // The isbn2 parser would reject an ISBN formatted like 978-2070368228,
  // so removing all hypens gives us more coverage
  isbn = dehyphenate(isbn)
  const data = __guard__(isbnParser(isbn), x => x.codes)

  // Some people input an isbn 13 without EAN prefix
  // so if the first attempt to parse an ISBN-10 fails, try to consider it
  // as an unnecessarily trunkated ISBN-13
  if ((data == null) && /^\d{10}$/.test(isbn)) { return parse(`978${isbn}`) }

  if (data != null) {
    let groupPrefix
    let { prefix, group, publisher, isbn13h } = data
    // It did happen that isbn2 parser returned without a prefix
    if (!prefix) { prefix = isbn13h.split('-')[0] }
    data.groupPrefix = (groupPrefix = `${prefix}-${group}`)
    data.publisherPrefix = `${groupPrefix}-${publisher}`
    const langData = groups[groupPrefix]
    if (langData != null) {
      data.groupLang = langData.lang
      data.groupLangUri = langData.wd
    }
  }

  return data
})

var dehyphenate = isbn => isbn.replace(/-/g, '')

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}