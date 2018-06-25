# Deduplicate work entity creation: every seed checks if a seed with matching title
# and authors let a work entity promise around, else creates one
# This allow to work around the fact that multiple seed might be looking for the same
# not-yet-existing entity work and that those seed being processed at about
# the same time, the database and search engine wouldn't have the time to update
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ defer } = __.require 'lib', 'promises'
{ formatTitle, formatAuthor } = require './work_entity_search_utils'
{ oneMinute } =  __.require 'lib', 'times'

cache = {}

module.exports =
  get: (seed)->
    key = buildKey seed
    deferred = cache[key]
    if deferred?
      # If there is a deferred object in the cache, its a hit: don't create
      # a new work entity, just wait for the first entity to be created
      _.info key, 'incrementing deferred depending count'
      deferred.depending += 1
      return deferred.promise
    else
      # If no deferred object could be found, its a miss: create a deferred object
      # and make sure to call 'set' later to let it resolve with the work entity
      # creation promise
      cache[key] = deferred = defer()
      # Init the counter of seeds depending on this promise
      _.info key, 'creating deferred'
      deferred.depending = 1
      return

  set: (seed, workPromise)->
    key = buildKey seed
    # It would be sad but the cache might have been emptied since the cache get
    # that init the defer
    deferred = cache[key] or= defer()
    deferred.depending -= 1
    # Pass the work entity creation promise to the other editions that got their
    # work entity promise from deferred.promise
    deferred.resolve workPromise
    cleanAfterBatch()
    return

buildKey = (seed)->
  { title, authors } = seed
  return formatTitle(title) + ' ' + authors.map(formatAuthor).sort().join(' ')

clean = ->
  for key, deferred of cache
    { depending, kept } = deferred
    # If there are no more depending promises or if this promise has been kept in cache
    # for more than a minute, delete it
    if depending is 0 or (kept? and _.now() - kept > oneMinute)
      _.info key, 'removing from deduplicating cache'
      delete cache[key]
    else
      deferred.kept or= _.now()
      _.warn key, "deduplicating cache not clean: still #{depending} depending"

  _.info Object.keys(cache), 'work entity deduplicating cache after cleaning'

# This cache should span long enough to let the time to CouchDB and ElasticSearch to be aware of the new entity work
cleanAfterBatch = _.debounce clean, 5000
