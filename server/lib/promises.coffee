breq = require 'breq'

module.exports =
  get: (url)-> breq.get(url).then (res)-> res.body
  post: (params)-> breq.post(params).then (res)-> res.body

  Promise: require 'bluebird'
  rejectedPromise: (err)->
    def = @Promise.defer()
    def.reject(err)
    return def.promise

  resolvedPromise: (res)->
    def = @Promise.defer()
    def.resolve(res)
    return def.promise
