__ = require('config').root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
Promise = promises_.Promise

levelBase = __.require 'level', 'base'

cacheDB = levelBase.simpleAPI 'cache'

module.exports =
  get: (key, method, context, args)->
    try _.types arguments, ['string', 'function', 'object|null', 'array'], 2
    catch err then return promises_.rejectedPromise(err)

    _.error args, 'args'
    checkCache(key)
    .then (res)->
      if res?.body? then return res.body
      else return requestMethod(key, method, context, args)


checkCache = (key)->
  cacheDB.get(key)
  .catch (err)-> console.warn err, key

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

