_ = require('config').root.require('builders', 'utils')
Promise = require 'bluebird'
requests = require './requests'

pluckSettled = (results)-> _.pluck results, '_settledValue'

promisesHandlers =
  Promise: Promise
  reject: Promise.reject.bind(Promise)
  resolve: Promise.resolve.bind(Promise)
  all: Promise.all.bind(Promise)
  settle: (promises)->
    Promise.settle(promises).then pluckSettled
  start: Promise.resolve.bind(Promise)
  Timeout: (ms)-> (promise)-> promise.timeout ms
  # skip throws in a standard way to be catched later
  # by NonSkip and not be treated as an error
  skip: ->
    err = new Error 'skip'
    err.skip = true
    throw err
  NonSkip: (catcher)->
    return filteredCatcher = (err)->
      if err.skip then _.noop
      else catcher err

# bundling NonSkip and _.Error handlers
promisesHandlers.NonSkipError = (label)->
  promisesHandlers.NonSkip _.Error(label)

module.exports = _.extend {}, requests, promisesHandlers
