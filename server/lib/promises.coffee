_ = require('config').universalPath.require('builders', 'utils')
Promise = require 'bluebird'
requests = require './requests'

promisesHandlers =
  Promise: Promise
  reject: Promise.reject.bind(Promise)
  resolve: Promise.resolve.bind(Promise)
  all: Promise.all.bind(Promise)
  props: Promise.props.bind(Promise)
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

settlers =
  settle: (promises)->
    inspectors = promises.map _.method('reflect')
    Promise.all inspectors
    .then pluckSettled
  settleProps: (promisesObj)->
    inspectorsProps = _.mapValues promisesObj, _.method('reflect')
    Promise.props inspectorsProps
    .then pluckSettledProps

# if _settledValueField is undefined, that's that the promise didnt fullfilled
# more dirty than the official solution http://bluebirdjs.com/docs/api/reflect.html
# but how simpler
pluckSettled = (inspectors)->
  inspectors.map returnValueIfFulfilled

pluckSettledProps = (inspectorsProps)->
  _.mapValues inspectorsProps, returnValueIfFulfilled

returnValueIfFulfilled = (inspector)->
  if inspector.isFulfilled() then inspector.value()
  else _.warn inspector, "promise didn't fullfilled"

# bundling NonSkip and _.Error handlers
promisesHandlers.NonSkipError = (label)->
  promisesHandlers.NonSkip _.Error(label)

module.exports = _.extend {}, requests, promisesHandlers, settlers
