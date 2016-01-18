__ = require('config').universalPath
_ = __.require 'builders', 'utils'
Promise = require 'bluebird'
requests = require './requests'
shared = __.require('sharedLibs', 'promises')(Promise)

all = Promise.all.bind Promise
props = Promise.props.bind Promise

promisesHandlers =
  Promise: Promise
  all: Promise.all.bind Promise
  props: Promise.props.bind Promise
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
    inspectors = promises.map reflectMethod
    Promise.all inspectors
    .then pluckSettled
  settleProps: (promisesObj)->
    inspectorsProps = _.mapValues promisesObj, reflectMethod
    Promise.props inspectorsProps
    .then pluckSettledProps

reflectMethod = _.method 'reflect'

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

module.exports = _.extend {}, shared, requests, promisesHandlers, settlers
