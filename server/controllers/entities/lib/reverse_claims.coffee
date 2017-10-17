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
  type = typeTailoredQuery[property]
  if type?
    pid = property.split(':')[1]
    runWdQuery { query: "#{type}_reverse_claims", pid, qid: value, refresh }
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
  .catch (err)->
    # Allow to request reverse claims for properties that aren't yet
    # whitelisted to be added to inv properties: simply ignore inv entities
    if err.message is "property isn't whitelisted" then return []
    else throw err

# Customize queries to tailor for specific types of results
# Ex: 'wdt:P921' reverse claims should not include films, etc
# but only works or series
typeTailoredQuery =
  # country of citizenship
  'wdt:P27': 'humans'
  # award received
  'wdt:P166': 'humans'
  # genre
  'wdt:P135': 'humans'
  # movement
  'wdt:P136': 'works'
  # original language
  'wdt:P364': 'works'
  # characters
  'wdt:P674': 'works'
  # narrative location
  'wdt:P840': 'works'
  # main subject
  'wdt:P921': 'works'

sortByScore = (scores)-> (a, b)-> scores[b] - scores[a]
