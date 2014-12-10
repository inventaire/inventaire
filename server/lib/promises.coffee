_ = require('config').root.require('builders', 'utils')
breq = require 'breq'
Promise = require 'bluebird'

pluckSettled = (results)-> _.pluck results, '_settledValue'

module.exports =
  get: (url)-> breq.get(url).then (res)-> res.body
  post: (params)-> breq.post(params).then (res)-> res.body

  Promise: Promise
  rejectedPromise: (err)->
    def = @Promise.defer()
    def.reject(err)
    return def.promise

  resolvedPromise: (res)->
    def = @Promise.defer()
    def.resolve(res)
    return def.promise

  settle: (promises)->
    Promise.settle(promises).then pluckSettled