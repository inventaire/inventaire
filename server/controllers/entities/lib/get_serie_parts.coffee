__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
runWdQuery = __.require 'data', 'wikidata/run_query'
prefixify = __.require 'lib', 'wikidata/prefixify'

module.exports = (uri, refresh)->
  [ prefix, id ] = uri.split ':'
  promises = []

  # If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if prefix is 'wd' then promises.push getWdSerieParts(id, refresh)

  promises.push getInvSerieParts(uri)

  promises_.all promises
  .then (results...)-> { parts: _.flatten(results...) }
  .catch _.ErrorRethrow('get serie parts err')


getWdSerieParts = (qid, refresh)->
  runWdQuery { query: 'serie-parts', qid, refresh }
  .map prefixify

getInvSerieParts = (uri)->
  # Querying only for 'part of' (wdt:P361) and not 'serie' (wdt:P179)
  # as we use only wdt:P361 internally
  entities_.byClaim 'wdt:P361', uri
  .get 'rows'
  .map getInvUri

getInvUri = (row)-> "inv:#{row.id}"
