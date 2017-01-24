__ = require('config').universalPath
_ = __.require 'builders', 'utils'
isbn_ = __.require('sharedLibs', 'isbn')(_)

{ parse:isbnParser } = require('isbn2').ISBN
groups = require './groups'

parse = (isbn)->
  # The isbn2 parser would reject an ISBN formatted like 978-2070368228,
  # so removing all hypens gives us more coverage
  isbn = isbn.replace /-/g, ''
  data = isbnParser(isbn)?.codes

  # Some people input an isbn 13 without EAN prefix
  # so if the first attempt to parse an ISBN-10 fails, try to consider it
  # as an unnecessarily trunkated ISBN-13
  if not data? and /\d{10}/.test(isbn) then return parse "978#{isbn}"

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

module.exports = _.extend isbn_,
  isValidIsbn: (isbn)-> isbnParser(isbn)?
  parse: parse
  toIsbn13: (isbn, hyphenate)->
    data = parse isbn
    unless data? then return
    if hyphenate then data.isbn13h else data.isbn13

  toIsbn13h: (isbn)-> parse(isbn).isbn13h
  toIsbn10h: (isbn)-> parse(isbn).isbn10h
