CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
assert_ = __.require 'utils', 'assert_types'

levelBase = __.require 'level', 'base'

db = levelBase.simpleSubDb 'cache'

{ offline } = CONFIG

{ oneMinute, oneDay, oneMonth } =  __.require 'lib', 'times'

module.exports =
  # - key: the cache key
  # - fn: a function with its context and arguments binded
  # - timespan: maximum acceptable age of the cached value in ms
  # - refresh: alias for timespan=0
  # - dry: return what's in cache or nothing: if the cache is empty, do not call the function
  # - dryFallbackValue: the value to return when no cached value can be found, to keep responses
  #   type consistent
  get: (params)->
    { key, fn, timespan, refresh, dry, dryFallbackValue } = params
    if refresh then timespan = 0
    timespan ?= oneMonth
    dry ?= false

    try
      assert_.string key
      unless dry then assert_.types [ 'function', 'number' ], [ fn, timespan ]
    catch err
      return error_.reject err, 500

    # Try to avoid cache miss when making a dry get
    # or when working offline (only useful in development)
    if dry or offline then timespan = Infinity

    # When passed a 0 timespan, it is expected to get a fresh value.
    # Refusing the old value is also a way to invalidate the current cache
    refuseOldValue = timespan is 0

    checkCache key, timespan
    .then requestOnlyIfNeeded.bind(null, key, fn, dry, dryFallbackValue, refuseOldValue)
    .catch (err)->
      label = "final cache_ err: #{key}"
      # not logging the stack trace in case of 404 and alikes
      if /^4/.test err.statusCode then _.warn err, label
      else _.error err, label

      throw err

  put: (key, value)->
    unless _.isNonEmptyString key then return error_.reject 'invalid key', 500

    unless value? then return error_.reject 'missing value', 500

    return putResponseInCache key, value

  # dataChange: date before which cached data
  # is outdated due to change in the data structure.
  # A convenient way to bust cached data after an update

  # exemple:
  # timespan = cache_.solveExpirationTime 'commons'
  # cache_.get { key, fn, timespan }

  # once the default expiration time is greater than the time since
  # data change, just stop passing a timespan

  solveExpirationTime: (dataChangeName, defaultTime = oneMonth)->
    dataChange = CONFIG.dataChange?[dataChangeName]
    unless dataChange? then return defaultTime

    timeSinceDataChange = Date.now() - dataChange
    if timeSinceDataChange < defaultTime then timeSinceDataChange
    else defaultTime

checkCache = (key, timespan)->
  db.get key
  .then (res)->
    # Returning nothing will trigger a new request
    unless res? then return

    { body, timestamp } = res

    # Reject outdated cached values
    unless isFreshEnough timestamp, timespan then return

    # In case there was nothing in cache
    if _.isEmpty body
      # Prevent re-requesting if it was already retried lately
      if isFreshEnough timestamp, 2 * oneDay
        _.log key, 'empty cache value: retried lately'
        return res
      # Otherwise, trigger a new request by returning nothing
      _.log key, 'empty cache value: retrying'
      return
    else
      return res

returnOldValue = (key, err)->
  checkCache key, Infinity
  .then (res)->
    if res? then res.body
    else
      # rethrowing the previous error as it's probably more meaningful
      err.old_value = null
      throw err

requestOnlyIfNeeded = (key, fn, dry, dryFallbackValue, refuseOldValue, cached)->
  if cached?
    _.info "from cache: #{key}"
    return cached.body

  if dry
    _.info "empty cache on dry get: #{key}"
    return dryFallbackValue

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
  db.put key,
    body: res
    timestamp: new Date().getTime()

isFreshEnough = (timestamp, timespan)-> not _.expired(timestamp, timespan)
