CONFIG = require('config')
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

levelBase = __.require 'level', 'base'

cacheDB = levelBase.simpleAPI 'cache'

if CONFIG.resetCacheAtStartup then cacheDB.reset()

oneMonth = 1000*60*60*24*30

module.exports =
  # EXPECT method to come with context and arguements .bind'ed
  # e.g. method = module.getData.bind(module, arg1, arg2)
  get: (key, method, timespan=oneMonth)->
    types = ['string', 'function', 'number']
    try _.types arguments, types, 2
    catch err then return error_.reject(err, 500)

    checkCache(key, timespan)
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

checkCache = (key, timespan)->
  cacheDB.get(key)
  .catch (err)->
    _.warn err, "checkCache err: #{key}"
    return
  .then (res)->
    if res? and isFreshEnough(res.timestamp, timespan)
      return res
    else return

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
