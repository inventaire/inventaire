__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ getNames, aggregateClaims } = require './helpers'
{ getOriginalLang } = __.require 'lib', 'wikidata/wikidata'
error_ = __.require 'lib', 'error/error'
wdk = require 'wikidata-sdk'
{ snapshotValidations } = __.require 'models', 'validations/item'
getBestLangValue = __.require('sharedLibs', 'get_best_lang_value')(_)

module.exports =
  edition: (edition, works, authors, series)->
    title = edition.claims['wdt:P1476']?[0]
    lang = getOriginalLang(edition.claims) or 'en'
    image = edition.claims['wdt:P18']?[0]
    return buildOperation {
      type: 'edition'
      entity: edition,
      works,
      title,
      lang,
      image,
      authors,
      series
    }

  work: (work, authors, series)->
    { originalLang: lang } = work
    title = getBestLangValue(lang, null, work.labels).value
    image = work.claims['wdt:P18']?[0]
    works = [ work ]
    return buildOperation {
      type: 'work'
      entity: work,
      works,
      title,
      lang,
      image,
      authors,
      series
    }

buildOperation = (params)->
  { type, entity, works, title, lang, image, authors, series } = params
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
  if snapshotValidations['entity:image'](image)
    snapshot['entity:image'] = image

  { uri } = entity
  _.type uri, 'string'

  return { key: uri, value: snapshot }

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
