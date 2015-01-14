_ = require('config').root.require('builders', 'utils')
bluereq = require 'bluereq'
Promise = require 'bluebird'

pluckSettled = (results)-> _.pluck results, '_settledValue'

module.exports =
  get: (url)-> bluereq.get(url).then (res)-> res.body
  post: (params)-> bluereq.post(params).then (res)-> res.body

  Promise: Promise
  reject: Promise.reject.bind(Promise)
  resolve: Promise.resolve.bind(Promise)

  settle: (promises)->
    Promise.settle(promises).then pluckSettled