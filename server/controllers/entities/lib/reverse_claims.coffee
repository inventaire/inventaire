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
runWdQuery = __.require 'data', 'wikidata/run_query'
getEntitiesPopularity = require './get_entities_popularity'

caseInsensitiveProperties = [
  'wdt:P2002'
]

module.exports = (params)->
  { property, value, refresh, sort } = params
  _.types [ property, value ], 'strings...'
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
  .then (uris)->
    unless sort then return uris

    getEntitiesPopularity uris
    .then (scores)-> uris.sort sortByScore(scores)

wikidataReverseClaims = (property, value, refresh)->
  customQuery = customReverseClaimsQuery[property]
  if customQuery?
    runWdQuery { query: customQuery, qid: value, refresh }
    .map prefixify
  else
    generalWikidataReverseClaims property, value, refresh

generalWikidataReverseClaims = (property, value, refresh)->
  key = "wd:reverse-claim:#{property}:#{value}"
  timestamp = if refresh then 0 else null
  cache_.get key, _wikidataReverseClaims.bind(null, property, value), timestamp

_wikidataReverseClaims = (property, value)->
  caseInsensitive = property in caseInsensitiveProperties
  wdProp = wd_.unprefixify property
  _.log [ property, value ], 'reverse claim'
  promises_.get wdk.getReverseClaims(wdProp, value, { caseInsensitive })
  .then wdk.simplifySparqlResults
  .map prefixify

invReverseClaims = (property, value)->
  entities_.byClaim property, value, true, true
  .map (entity)-> getInvEntityCanonicalUri(entity)[0]

# Customize queries to tailor for specific types of results
# Ex: 'wdt:P921' reverse claims should not include films, etc
# but only works or series
customReverseClaimsQuery =
  'wdt:P921': 'subjects_works'

sortByScore = (scores)-> (a, b)-> scores[b] - scores[a]
