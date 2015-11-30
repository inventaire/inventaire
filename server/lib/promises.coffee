_ = require('config').universalPath.require('builders', 'utils')
Promise = require 'bluebird'
requests = require './requests'


promisesHandlers =
  Promise: Promise
  reject: Promise.reject.bind(Promise)
  resolve: Promise.resolve.bind(Promise)
  all: Promise.all.bind(Promise)
  props: Promise.props.bind(Promise)
  settle: (promises)->
    reflects = _.invoke promises, 'reflect'
    Promise.all(reflects).then pluckSettled

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

pluckSettled = (results)->
  # if _settledValueField is undefined, that's that the promise didnt fullfilled
  # more dirty than the official solution http://bluebirdjs.com/docs/api/reflect.html
  # but how simpler
  _.pluck results, '_settledValueField'

# bundling NonSkip and _.Error handlers
promisesHandlers.NonSkipError = (label)->
  promisesHandlers.NonSkip _.Error(label)

module.exports = _.extend {}, requests, promisesHandlers
