__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ getNames } = require './helpers'
{ getOriginalLang } = __.require 'lib', 'wikidata/wikidata'
error_ = __.require 'lib', 'error/error'

module.exports =
  # all editions items have the same snapshot
  edition: (edition, work, authors, series)->
    title = edition.claims['wdt:P1476']?[0]
    lang = getOriginalLang(edition.claims) or 'en'
    image = edition.claims['wdt:P18']?[0]
    return wrapSnapshot title, lang, image, authors, series

  work: (lang, work, authors, series)->
    title = work.labels[lang]
    image = work.claims['wdt:P18']?[0]
    return wrapSnapshot title, lang, image, authors, series

wrapSnapshot = (title, lang, image, authors, series)->
  _.types arguments, [ 'string', 'string', 'string|undefined', 'array', 'array' ]

  unless _.isNonEmptyString title
    throw error_.new 'no title found', 400, work

  _.log series, 'series'
  authorsNames = getNames lang, authors
  seriesNames = getNames lang, series
  _.log seriesNames, 'seriesNames'

  snapshot =
    'entity:title': title
    'entity:lang': lang
    'entity:authors': authorsNames
    'entity:series': seriesNames

  if image? then snapshot['entity:image'] = image

  return snapshot
