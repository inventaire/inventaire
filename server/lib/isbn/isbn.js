__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ parse: isbnParser } = require('isbn2').ISBN
parse = require './parse'
wdLang = require 'wikidata-lang'

# Removing any non-alpha numeric characters, especially '-' and spaces
normalizeIsbn = (text)->
  text
  # Remove hypens
  .replace /\W/g, ''
  # Make sure any 'x' is an X
  .toUpperCase()

isNormalizedIsbn = (text)-> /^(97(8|9))?\d{9}(\d|X)$/.test text

module.exports =
  parse: parse
  normalizeIsbn: normalizeIsbn
  looksLikeAnIsbn: (text)->
    unless typeof text is 'string' then return false
    cleanedText = normalizeIsbn text
    if isNormalizedIsbn cleanedText
      switch cleanedText.length
        when 10 then return 10
        when 13 then return 13
    return false
  isValidIsbn: (isbn)-> isbnParser(isbn)?
  toIsbn13: (isbn, hyphenate)->
    data = parse isbn
    unless data? then return
    if hyphenate then data.isbn13h else data.isbn13

  toIsbn13h: (isbn)-> parse(isbn).isbn13h
  toIsbn10h: (isbn)-> parse(isbn).isbn10h

  guessLangFromIsbn: (isbn)->
    langUri = parse(isbn)?.groupLangUri
    unless langUri? then return
    wdId = langUri.split(':')[1]
    return wdLang.byWdId[wdId]?.code
