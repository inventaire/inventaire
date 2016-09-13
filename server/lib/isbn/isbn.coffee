isbn2 = require('isbn2').ISBN
groups = require './groups'

parse = (isbn)->
  data = isbn2.parse(isbn)?.codes
  if data?
    { group, publisher } = data
    data.gs1Prefix = gs1Prefix = data.isbn13[0..2]
    data.groupPrefix = groupPrefix = "#{gs1Prefix}-#{group}"
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
