__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ getAuthorsNames } = require './helpers'
{ getOriginalLang } = __.require 'lib', 'wikidata/wikidata'

module.exports =
  # all editions items have the same snapshot
  edition: (edition, work, authors)->
    title = edition.claims['wdt:P1476']?[0]
    lang = getOriginalLang(edition.claims) or 'en'
    return wrapSnapshot title, lang, authors

  work: (lang, work, authors)->
    title = work.labels[lang]
    return wrapSnapshot title, lang, authors

wrapSnapshot = (title, lang, authors)->
  unless _.isNonEmptyString title
    throw error_.new 'no title found', 400, work

  authorsNamesString = getAuthorsNames lang, authors
  return {
    'entity:title': title
    'entity:authors': authorsNamesString
  }
