{ parse: isbnParser } = require('isbn2').ISBN
groups = require './groups'

module.exports = parse = (isbn)->
  # The isbn2 parser would reject an ISBN formatted like 978-2070368228,
  # so removing all hypens gives us more coverage
  isbn = dehyphenate isbn
  data = isbnParser(isbn)?.codes

  # Some people input an isbn 13 without EAN prefix
  # so if the first attempt to parse an ISBN-10 fails, try to consider it
  # as an unnecessarily trunkated ISBN-13
  if not data? and /^\d{10}$/.test(isbn) then return parse "978#{isbn}"

  if data?
    { prefix, group, publisher, isbn13h } = data
    # It did happen that isbn2 parser returned without a prefix
    prefix or= isbn13h.split('-')[0]
    data.groupPrefix = groupPrefix = "#{prefix}-#{group}"
    data.publisherPrefix = "#{groupPrefix}-#{publisher}"
    langData = groups[groupPrefix]
    if langData?
      data.groupLang = langData.lang
      data.groupLangUri = langData.wd

  return data

dehyphenate = (isbn)-> isbn.replace /-/g, ''
