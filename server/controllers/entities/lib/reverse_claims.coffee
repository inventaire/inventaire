__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
assert_ = __.require 'utils', 'assert_types'
wdk = require 'wikidata-sdk'
promises_ = __.require 'lib', 'promises'
requests_ = __.require 'lib', 'requests'
entities_ = require './entities'
{ prefixifyWd, unprefixify } = __.require 'controllers', 'entities/lib/prefix'
cache_ = __.require 'lib', 'cache'
getInvEntityCanonicalUri = require './get_inv_entity_canonical_uri'
couch_ = __.require 'lib', 'couch'
runWdQuery = __.require 'data', 'wikidata/run_query'
getEntitiesPopularity = require './get_entities_popularity'

caseInsensitiveProperties = [
  'wdt:P2002'
]

blacklistedProperties = [
  # Too many results, can't be sorted
  'wdt:P31'
  'wdt:P407'
]

module.exports = (params)->
  { property, value, refresh, sort, dry, localOnly } = params
  assert_.strings [ property, value ]

  if property in blacklistedProperties
    return error_.reject 'blacklisted property', 400, { property }

  promises = []

  unless localOnly
    promises.push requestWikidataReverseClaims(property, value, refresh, dry)

  promises.push invReverseClaims(property, value)

  promises_.all promises
  .then _.flatten
  .then _.compact
  .then (uris)->
    unless sort then return uris

    getEntitiesPopularity uris
    .then (scores)-> uris.sort sortByScore(scores)

requestWikidataReverseClaims = (property, value, refresh, dry)->
  if _.isEntityUri value
    [ prefix, id ] = value.split ':'
    # If the prefix is 'inv' or 'isbn', no need to check Wikidata
    if prefix is 'wd' then return wikidataReverseClaims property, id, refresh, dry
  else
    return wikidataReverseClaims property, value, refresh, dry

wikidataReverseClaims = (property, value, refresh, dry)->
  type = typeTailoredQuery[property]
  if type?
    pid = property.split(':')[1]
    runWdQuery { query: "#{type}_reverse_claims", pid, qid: value, refresh, dry }
    .map prefixifyWd
  else
    generalWikidataReverseClaims property, value, refresh, dry

generalWikidataReverseClaims = (property, value, refresh, dry)->
  key = "wd:reverse-claim:#{property}:#{value}"
  fn = _wikidataReverseClaims.bind null, property, value
  cache_.get { key, fn, refresh, dry, dryFallbackValue: [] }

_wikidataReverseClaims = (property, value)->
  caseInsensitive = property in caseInsensitiveProperties
  wdProp = unprefixify property
  _.log [ property, value ], 'reverse claim'
  requests_.get wdk.getReverseClaims(wdProp, value, { caseInsensitive })
  .then wdk.simplifySparqlResults
  .map prefixifyWd

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
  # educated at
  'wdt:P69': 'humans'
  # native language
  'wdt:P103': 'humans'
  # occupation
  'wdt:P106': 'humans'
  # publisher
  'wdt:P123': 'editions'
  # award received
  'wdt:P166': 'humans'
  # genre
  'wdt:P135': 'humans'
  # movement
  'wdt:P136': 'works'
  # collection
  'wdt:P195': 'editions'
  # original language
  'wdt:P364': 'works'
  # language of work
  'wdt:P407': 'works'
  # translator
  'wdt:P655': 'editions'
  # characters
  'wdt:P674': 'works'
  # narrative location
  'wdt:P840': 'works'
  # main subject
  'wdt:P921': 'works'
  # inspired by
  'wdt:P941': 'works'

sortByScore = (scores)-> (a, b)-> scores[b] - scores[a]
