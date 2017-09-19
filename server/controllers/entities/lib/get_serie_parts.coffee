__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
runWdQuery = __.require 'data', 'wikidata/run_query'
prefixify = __.require 'lib', 'wikidata/prefixify'
{ getSimpleDayDate, sortByOrdinalOrDate } = require './queries_utils'

module.exports = (uri, refresh)->
  [ prefix, id ] = uri.split ':'
  promises = []

  # If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if prefix is 'wd' then promises.push getWdSerieParts(id, refresh)

  promises.push getInvSerieParts(uri)

  promises_.all promises
  .then (results...)->
    parts: _.flatten(results...).sort(sortByOrdinalOrDate)
  .catch _.ErrorRethrow('get serie parts err')

getWdSerieParts = (qid, refresh)->
  runWdQuery { query: 'serie-parts', qid, refresh }
  .map (result)->
    uri: prefixify result.part
    date: getSimpleDayDate result.date
    ordinal: result.ordinal

getInvSerieParts = (uri)->
  # Querying only for 'serie' (wdt:P179) and not 'part of' (wdt:P361)
  # as we use only wdt:P179 internally
  entities_.byClaim 'wdt:P179', uri, true
  .get 'rows'
  .map parseRow

parseRow = (row)->
  uri: "inv:#{row.id}"
  date: row.doc.claims['wdt:P577']?[0]
  ordinal: row.doc.claims['wdt:P1545']?[0]
