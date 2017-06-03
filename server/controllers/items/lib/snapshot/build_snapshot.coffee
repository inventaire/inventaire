__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ getNames } = require './helpers'
{ getOriginalLang } = __.require 'lib', 'wikidata/wikidata'
error_ = __.require 'lib', 'error/error'
{ snapshotTests } = __.require 'models', 'tests/item'

module.exports =
  # all editions items have the same snapshot
  edition: (edition, work, authors, series)->
    title = edition.claims['wdt:P1476']?[0]
    lang = getOriginalLang(edition.claims) or 'en'
    image = edition.claims['wdt:P18']?[0]
    return wrapSnapshot edition, work, title, lang, image, authors, series

  work: (lang, work, authors, series)->
    title = work.labels[lang]
    image = work.claims['wdt:P18']?[0]
    return wrapSnapshot work, work , title, lang, image, authors, series

wrapSnapshot = (entity, work, title, lang, image, authors, series)->
  unless _.isNonEmptyString title
    throw error_.new 'no title found', 400, data.entity

  snapshot =
    'entity:title': title
    'entity:lang': lang

  authorsNames = getNames lang, authors
  seriesNames = getNames lang, series

  if authorsNames? then snapshot['entity:authors'] = authorsNames
  if seriesNames?
    snapshot['entity:series'] = seriesNames
    rank = work.claims['wdt:P1545']?[0]
    if rank? then snapshot['entity:rank'] = rank

  # Filtering out Wikimedia File names, keeping only IPFS hashes or URLs
  if snapshotTests['entity:image'](image) then snapshot['entity:image'] = image

  return snapshot
