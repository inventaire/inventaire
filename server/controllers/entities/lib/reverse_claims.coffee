__ = require('config').universalPath
_ = __.require 'builders', 'utils'
wdk = require 'wikidata-sdk'
wd_ = __.require 'lib', 'wikidata/wikidata'
promises_ = __.require 'lib', 'promises'
entities_ = require './entities'
prefixify = __.require 'lib', 'wikidata/prefixify'
cache_ = __.require 'lib', 'cache'

module.exports = (property, uri, refresh)->
  [ prefix, id ] = uri.split ':'
  promises = []

  # If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if prefix is 'wd'
    promises.push wikidataReverseClaims(property, id, refresh)

  promises.push invReverseClaims(property, uri)

  promises_.all promises
  .then _.flatten

wikidataReverseClaims = (property, wdId, refresh)->
  key = "wd:reverse-claim:#{property}:#{wdId}"
  timestamp = if refresh then 0 else null
  cache_.get key, _wikidataReverseClaims.bind(null, property, wdId), timestamp

_wikidataReverseClaims = (property, wdId)->
  wdProp = wd_.unprefixifyPropertyId property
  promises_.get _.log(wdk.getReverseClaims(wdProp, wdId), 'reverseclaim')
  .then wdk.simplifySparqlResults
  .map prefixify

invReverseClaims = (property, uri)->
  entities_.idsByClaim property, uri
  .map (id)-> "inv:#{id}"
