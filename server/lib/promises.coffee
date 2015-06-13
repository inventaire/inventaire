_ = require('config').root.require('builders', 'utils')
Promise = require 'bluebird'
breq = require 'bluereq'

requests =
  get: (url)-> breq.get(url).then (res)-> res.body
  post: (params)-> breq.post(params).then (res)-> res.body


pluckSettled = (results)-> _.pluck results, '_settledValue'

promisesHandlers =
  Promise: Promise
  reject: Promise.reject.bind(Promise)
  resolve: Promise.resolve.bind(Promise)
  settle: (promises)->
    Promise.settle(promises).then pluckSettled
  start: Promise.resolve.bind(Promise)
  delayed: (val, delay=5000)->
    Promise.delay(delay).then -> val
  Timeout: (ms)-> (promise)-> promise.timeout ms


module.exports = _.extend {}, requests, promisesHandlers
