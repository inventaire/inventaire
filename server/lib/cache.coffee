CONFIG = require('config')
__ = CONFIG.root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
Promise = promises_.Promise

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
    catch err then return promises_.reject(err)

    checkCache(key, timespan)
    .then (res)->
      requestOnlyIfNeeded(res, key, method)
    .catch (err)->
      _.warn err, "final cache_ err: #{key}"

checkCache = (key, timespan)->
  cacheDB.get(key)
  .catch (err)->
    _.warn err, "checkCache err: #{key}"
    return
  .then (res)->
    if res? and isFreshEnough(res.timestamp, timespan)
      return res
    else return

requestOnlyIfNeeded = (res, key, method)->
  if res?
    _.info "from cache: #{key}"
    res.body
  else
    method()
    .then (res)->
      _.info "from remote data source: #{key}"
      putResponseInCache(key, res)
      return res

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
