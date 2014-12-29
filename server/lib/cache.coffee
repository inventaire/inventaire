__ = require('config').root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
Promise = promises_.Promise

levelBase = __.require 'level', 'base'

cacheDB = levelBase.simpleAPI 'cache'

oneMonth = 1000*60*60*24*30

module.exports =
  get: (key, method, context, args, timespan=oneMonth)->
    types = ['string', 'function', 'object|null', 'array|null', 'number']
    try _.types arguments, types, 2
    catch err then return promises_.rejectedPromise(err)

    checkCache(key, timespan)
    .then (res)-> requestOnlyIfNeeded(res, key, method, context, args)

checkCache = (key, timespan)->
  cacheDB.get(key)
  .catch (err)-> console.warn 'checkCache err', err, key
  .then (res)->
    if res? and isFreshEnough(res.timestamp, timespan)
      return res
    else return
  .catch (err)-> console.warn 'isFreshEnough err', err, key

requestOnlyIfNeeded = (res, key, method, context, args)->
  if res? then res.body
  else requestMethod(key, method, context, args)

requestMethod = (key, method, context, args)->
  args or= [key]
  method.apply context, args
  .then (res)->
    cacheResponse(key, res)
    return res
  .catch (err)-> console.error 'requestMethod error:', err

cacheResponse = (key, res)->
  obj =
    body: res
    timestamp: new Date().getTime()
  _.info [key, res], 'CACHING'
  cacheDB.put key, obj

isFreshEnough = (timestamp, timespan)->
  _.types arguments, ['number', 'number']
  age = Date.now() - timestamp
  return age < timespan
