__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ getNames, aggregateClaims } = require './helpers'
{ getOriginalLang } = __.require 'lib', 'wikidata/wikidata'
error_ = __.require 'lib', 'error/error'
{ snapshotTests } = __.require 'models', 'tests/item'

module.exports =
  # all editions items have the same snapshot
  edition: (edition, works, authors, series)->
    title = edition.claims['wdt:P1476']?[0]
    lang = getOriginalLang(edition.claims) or 'en'
    image = edition.claims['wdt:P18']?[0]
    return wrapSnapshot edition, works, title, lang, image, authors, series

  work: (lang, work, authors, series)->
    title = work.labels[lang]
    image = work.claims['wdt:P18']?[0]
    works = [ work ]
    return wrapSnapshot work, works, title, lang, image, authors, series

wrapSnapshot = (entity, works, title, lang, image, authors, series)->
  _.type works, 'array'
  unless _.isNonEmptyString title
    throw error_.new 'no title found', 400, entity

  snapshot =
    'entity:title': title
    'entity:lang': lang

  authorsNames = getNames lang, authors
  seriesNames = getNames lang, series

  if authorsNames? then snapshot['entity:authors'] = authorsNames
  if seriesNames?
    snapshot['entity:series'] = seriesNames
    setOrdinal snapshot, works

  # Filtering out Wikimedia File names, keeping only IPFS hashes or URLs
  if snapshotTests['entity:image'](image) then snapshot['entity:image'] = image

  return snapshot

setOrdinal = (snapshot, works)->
  if works.length is 1
    work = works[0]
    ordinal = work.claims['wdt:P1545']?[0]
    if ordinal? then snapshot['entity:ordinal'] = ordinal
  else
    series = aggregateClaims works, 'wdt:P179'
    # Aggregate ordinals only if works are from the same unique serie
    if series.length is 1
      ordinals = aggregateClaims works, 'wdt:P1545'
      if ordinals.length > 0 then snapshot['entity:ordinal'] = ordinals.join(',')
