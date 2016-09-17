{ parse:isbn2Parser } = require('isbn2').ISBN
groups = require './groups'

parse = (isbn)->
  data = isbn2Parser(isbn)?.codes
  if data?
    { prefix, group, publisher } = data
    data.groupPrefix = groupPrefix = "#{prefix}-#{group}"
    data.publisherPrefix = "#{groupPrefix}-#{publisher}"
    langData = groups[groupPrefix]
    if langData?
      data.groupLang = langData.lang
      data.groupLangUri = langData.wd

  return data

module.exports =
  parse: parse
  toIsbn13: (isbn, hyphenate)->
    data = parse isbn
    unless data? then return
    if hyphenate then data.isbn13h else data.isbn13
