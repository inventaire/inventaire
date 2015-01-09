_ = require('config').root.require('builders', 'utils')
bluereq = require 'bluereq'
Promise = require 'bluebird'

pluckSettled = (results)-> _.pluck results, '_settledValue'

module.exports =
  get: (url)-> bluereq.get(url).then (res)-> res.body
  post: (params)-> bluereq.post(params).then (res)-> res.body

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