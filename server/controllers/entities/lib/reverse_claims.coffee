__ = require('config').universalPath
_ = __.require 'builders', 'utils'
wdk = require 'wikidata-sdk'
wd_ = __.require 'lib', 'wikidata/wikidata'
promises_ = __.require 'lib', 'promises'
entities_ = require './entities'
prefixify = __.require 'lib', 'wikidata/prefixify'

module.exports = (property, uri)->
  [ prefix, id ] = uri.split ':'
  promises = []

  # If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if prefix is 'wd' then promises.push wikidataReverseClaims(property, id)

  promises.push entities_.idsByClaim(property, uri)

  promises_.all promises
  .then _.flatten

wikidataReverseClaims = (property, wdId)->
  wdProp = wd_.unprefixifyPropertyId property
  promises_.get wdk.getReverseClaims(wdProp, wdId)
  .then wdk.simplifySparqlResults
  .map prefixify
