__ = require('config').universalPath
_ = __.require 'builders', 'utils'
wdk = require 'wikidata-sdk'
wd_ = __.require 'lib', 'wikidata/wikidata'
promises_ = __.require 'lib', 'promises'
entities_ = require './entities'
prefixify = __.require 'lib', 'wikidata/prefixify'
cache_ = __.require 'lib', 'cache'
getInvEntityCanonicalUri = require './get_inv_entity_canonical_uri'
couch_ = __.require 'lib', 'couch'

module.exports = (property, value, refresh)->
  promises = []

  isEntityValue = _.isEntityUri value

  if isEntityValue
    [ prefix, id ] = value.split ':'
    # If the prefix is 'inv' or 'isbn', no need to check Wikidata
    if prefix is 'wd' then promises.push wikidataReverseClaims(property, id, refresh)
  else
    promises.push wikidataReverseClaims(property, value, refresh)

  promises.push invReverseClaims(property, value)

  promises_.all promises
  .then _.flatten

wikidataReverseClaims = (property, value, refresh)->
  key = "wd:reverse-claim:#{property}:#{value}"
  timestamp = if refresh then 0 else null
  cache_.get key, _wikidataReverseClaims.bind(null, property, value), timestamp

_wikidataReverseClaims = (property, value)->
  wdProp = wd_.unprefixifyPropertyId property
  _.log [property, value], 'reverse claim'
  promises_.get wdk.getReverseClaims(wdProp, value)
  .then wdk.simplifySparqlResults
  .map prefixify

invReverseClaims = (property, value)->
  entities_.byClaim property, value, true, true
  .map (entity)-> getInvEntityCanonicalUri(entity)[0]
