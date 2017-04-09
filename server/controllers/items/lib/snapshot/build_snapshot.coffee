__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ getAuthorsNames } = require './helpers'
{ getOriginalLang } = __.require 'lib', 'wikidata/wikidata'

module.exports =
  # all editions items have the same snapshot
  edition: (edition, work, authors)->
    title = edition.claims['wdt:P1476']?[0]
    lang = getOriginalLang(edition.claims) or 'en'
    image = edition.claims['wdt:P18']?[0]
    return wrapSnapshot title, lang, image, authors

  work: (lang, work, authors)->
    title = work.labels[lang]
    image = work.claims['wdt:P18']?[0]
    return wrapSnapshot title, lang, image, authors

wrapSnapshot = (title, lang, image, authors)->
  unless _.isNonEmptyString title
    throw error_.new 'no title found', 400, work

  authorsNamesString = getAuthorsNames lang, authors

  snapshot =
    'entity:title': title
    'entity:authors': authorsNamesString
    'entity:lang': lang

  if image? then snapshot['entity:image'] = image

  return snapshot
