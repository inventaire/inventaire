CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

levelBase = __.require 'level', 'base'

cacheDB = levelBase.simpleAPI 'cache'

if CONFIG.resetCacheAtStartup then cacheDB.reset()
{ offline } = CONFIG

{ oneDay, oneMonth } =  __.require 'lib', 'times'

module.exports = cache_ =
  # EXPECT function to come with context and arguments .bind'ed
  # e.g. function = module.getData.bind(module, arg1, arg2)
  get: (key, fn, timespan=oneMonth, retry=true)->
    types = ['string', 'function', 'number', 'boolean']
    try _.types arguments, types, 2
    catch err then return error_.reject err, 500

    # Try to avoid cache miss when working offline (only useful in development)
    if offline then timespan = Infinity

    # When passed a 0 timespan, it is expected to get a fresh value.
    # Refusing the old value is also a way to invalidate the current cache
    refuseOldValue = timespan is 0

    checkCache key, timespan, retry
    .then requestOnlyIfNeeded.bind(null, key, fn, refuseOldValue)
    .catch (err)->
      label = "final cache_ err: #{key}"
      # not logging the stack trace in case of 404 and alikes
      if /^4/.test err.statusCode then _.warn err, label
      else _.error err, label

      throw err

  # An alternative get function to use when the function call might take a while
  # and we are in a hury, and it's ok to return nothing
  fastGet: (key, fn, timespan=oneMonth)->
    try _.types [ key, fn, timespan ], [ 'string', 'function', 'number' ]
    catch err then return error_.reject err, 500

    cacheDB.get key
    .then (res)->
      # If there is something cached and it's fresh enough, just return it
      if res?.body? and isFreshEnough(res.timestamp, timespan)
        return res.body

      # Else plan an update and return what we presently have in cache
      # (possibly nothing)
      addToUpdateQueue { key, fn, timespan }
      return res?.body

  # Return what's in cache. If nothing, return nothing: no request performed
  dryGet: (key, timespan=oneMonth)->
    try _.types [ key, timespan ], [ 'string', 'number' ]
    catch err then return error_.reject err, 500

    checkCache key, timespan
    .then (cached)-> cached?.body

  put: (key, value)->
    unless _.isNonEmptyString key then return error_.reject 'invalid key', 500

    unless value? then return error_.reject 'missing value', 500

    return putResponseInCache key, value

  # dataChange: date before which cached data
  # is outdated due to change in the data structure.
  # A convenient way to bust cached data after an update

  # exemple:
  # timespan = cache_.solveExpirationTime 'commons'
  # cache_.get key, fn, timespan

  # once the default expiration time is greater than the time since
  # data change, just stop passing a timespan

  solveExpirationTime: (dataChangeName, defaultTime=oneMonth)->
    dataChange = CONFIG.dataChange?[dataChangeName]
    unless dataChange? then return defaultTime

    timeSinceDataChange = Date.now() - dataChange
    if timeSinceDataChange < defaultTime then timeSinceDataChange
    else defaultTime

checkCache = (key, timespan, retry)->
  cacheDB.get key
  .then (res)->
    unless res? then return

    { body, timestamp } = res
    unless isFreshEnough(timestamp, timespan) then return

    if retry then return retryIfEmpty res, key
    else res

retryIfEmpty = (res, key)->
  { body, timestamp } = res
  unless emptyBody body then return res
  else
    # if it was retried lately
    if isFreshEnough timestamp, 2*oneDay
      _.log key, 'empty cache value: retried lately'
      return res
    else
      _.log key, 'empty cache value: retrying'
      return

emptyBody = (body)->
  unless body? then return true
  if _.isObject body then return _.objLength(body) is 0
  if _.isString body then return body.length is 0
  # doesnt expect other types

returnOldValue = (key, err)->
  checkCache key, Infinity
  .then (res)->
    if res? then res.body
    else
      # rethrowing the previous error as it's probably more meaningful
      err.old_value = null
      throw err

requestOnlyIfNeeded = (key, fn, refuseOldValue, cached)->
  if cached?
    _.info "from cache: #{key}"
    cached.body
  else
    fn()
    .then (res)->
      _.info "from remote data source: #{key}"
      putResponseInCache key, res
      return res
    .catch (err)->
      if refuseOldValue
        _.warn err, "#{key} request err (returning nothing)"
        return
      else
        _.warn err, "#{key} request err (returning old value)"
        return returnOldValue key, err

putResponseInCache = (key, res)->
  _.info "caching #{key}"
  cacheDB.put key,
    body: res
    timestamp: new Date().getTime()

isFreshEnough = (timestamp, timespan)-> not _.expired(timestamp, timespan)

updateQueue = []
ongoingUpdates = false

runNextUpdate = ->
  nextUpdateData = updateQueue.shift()
  unless nextUpdateData?
    ongoingUpdates = false
    _.info 'emptied cache update queue'
    return

  ongoingUpdates = true
  { key, fn, timespan } = nextUpdateData

  cache_.get key, fn, timespan
  .catch _.Error("#{key} cache udpate err")
  .then runNextUpdate

addToUpdateQueue = (updateData)->
  updateQueue.push updateData
  # Restart the update queue if it was idle
  unless ongoingUpdates then runNextUpdate()
