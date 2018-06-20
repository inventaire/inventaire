CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
cache_ = __.require 'lib', 'cache'
getPopularityByUri = require './get_popularity_by_uri'
jobs_ = __.require 'level', 'jobs'
{ interval } = CONFIG.jobs['wd:popularity']
# If an entity is on Wikidata, consider it to be already somewhat popular
wdEntityBaseScore = 10

module.exports = (uris, refresh)->
  _.type uris, 'array'
  if uris.length is 0 then return promises_.resolve {}
  urisPopularity = _.indexAppliedValue uris, getPopularity(refresh)
  return promises_.props urisPopularity

getPopularity = (refresh)-> (uri)->
  unless _.isEntityUri(uri) then throw error_.new 'invalid uri', 400, uri

  key = buildKey uri
  timespan = if refresh then 0 else null
  fn = getPopularityByUriOrQueue.bind null, uri

  cache_.get key, fn, timespan
  .then applyDefaultValue(uri)

buildKey = (uri)-> "popularity:#{uri}"

getPopularityByUriOrQueue = (uri)->
  prefix = uri.split(':')[0]
  if prefix isnt 'wd' then return getPopularityByUri uri

  # Queue job to work around the slow popularity calculation
  # for Wikidata entities, which rely on remote SPARQL queries
  # which are limited to 5 concurrent requests
  wdPopularityQueue.push uri
  # Do not return the wdEntityBaseScore as it would be saved in cache
  # preventing the popularity to be really calculated once the queue
  # reaches it as a value will already be available
  .then -> null
  .catch _.ErrorRethrow('wdPopularityQueue.push err')

applyDefaultValue = (uri)-> (value)->
  if value? then return value
  prefix = uri.split(':')[0]
  if prefix is 'wd' then return wdEntityBaseScore
  # Returning 0 if the cache is currently empty, which is kind of rational:
  # if the cache is empty, the entity isn't that popular
  return 0

wdPopularityWorker = (jobId, uri, cb)->
  key = buildKey uri
  _.log uri, 'wdPopularityWorker uri'
  # Check that the score wasn't calculated since this job was queued
  cache_.dryGet key
  .then (res)->
    if res? then return
    getPopularityByUri uri
    .then (score)->
      _.log score, "wdPopularityWorker #{uri} score"
      cache_.put key, wdEntityBaseScore + score
    # Spacing requests
    .delay interval
  .catch _.ErrorRethrow('wdPopularityWorker err')

wdPopularityQueue = jobs_.initQueue 'wd:popularity', wdPopularityWorker, 1
