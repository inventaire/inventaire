CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

levelBase = __.require 'level', 'base'

cacheDB = levelBase.simpleAPI 'cache'

if CONFIG.resetCacheAtStartup then cacheDB.reset()

{ oneDay, oneMonth } =  __.require 'lib', 'times'

module.exports =
  # EXPECT method to come with context and arguements .bind'ed
  # e.g. method = module.getData.bind(module, arg1, arg2)
  get: (key, method, timespan=oneMonth, retry=true)->
    types = ['string', 'function', 'number', 'boolean']
    try _.types arguments, types, 2
    catch err then return error_.reject(err, 500)

    checkCache key, timespan, retry
    .then requestOnlyIfNeeded.bind(null, key, method)
    .catch (err)->
      _.warn err, "final cache_ err: #{key}"
      throw err

  # dataChange: date before which cached data
  # is outdated due to change in the data structure.
  # A convenient way to bust cached data after an update

  # exemple:
  # timespan = cache_.solveExpirationTime 'commons'
  # cache_.get key, method, timespan

  # once the default expiration time is greater than the time since
  # data change, just stop passing a timespan

  solveExpirationTime: (dataChangeName, defaultTime=oneMonth)->
    dataChange = CONFIG.dataChange?[dataChangeName]
    unless dataChange? then return defaultTime

    timeSinceDataChange = _.now() - dataChange
    if timeSinceDataChange < defaultTime then timeSinceDataChange
    else defaultTime

checkCache = (key, timespan, retry)->
  cacheDB.get(key)
  .catch (err)->
    _.warn err, "checkCache err: #{key}"
    return
  .then (res)->
    unless res? then return

    { body, timestamp } = res
    unless isFreshEnough timestamp, timespan then return

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
  checkCache(key, Infinity)
  .then (res)->
    if res? then res.body
    else
      # rethrowing the previous error as it's probably more meaningful
      err.old_value = null
      throw err

requestOnlyIfNeeded = (key, method, cached)->
  if cached?
    # _.info "from cache: #{key}"
    cached.body
  else
    method()
    .then (res)->
      _.info "from remote data source: #{key}"
      putResponseInCache(key, res)
      return res
    .catch (err)->
      _.warn err, "#{key} request err (returning old value)"
      return returnOldValue(key, err)

putResponseInCache = (key, res)->
  obj =
    body: res
    timestamp: new Date().getTime()
  _.info "caching #{key}"
  cacheDB.put key, obj

isFreshEnough = (timestamp, timespan)->
  _.types arguments, ['number', 'number']
  age = Date.now() - timestamp
  return age < timespan
