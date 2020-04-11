const { parse: isbnParser } = require('isbn3')
const groups = require('./groups')

const parse = module.exports = isbn => {
  const isbnData = isbnParser(isbn)

  if (isbnData == null) {
    // Some people input an isbn 13 without EAN prefix
    // so if the first attempt to parse an ISBN-10 fails, try to consider it
    // as an unnecessarily trunkated ISBN-13
    if (/^\d{10}$/.test(isbn)) return parse(`978${isbn}`)
    else return
  }

  let { prefix } = isbnData
  const { group, publisher, isbn13h } = isbnData

  // It did happen that isbn3 parser returned without a prefix
  if (!prefix) prefix = isbn13h.split('-')[0]

  const groupPrefix = isbnData.groupPrefix = `${prefix}-${group}`

  isbnData.publisherPrefix = `${groupPrefix}-${publisher}`

  const langData = groups[groupPrefix]

  if (langData != null) {
    isbnData.groupLang = langData.lang
    isbnData.groupLangUri = langData.wd
  }

  return isbnData
}
