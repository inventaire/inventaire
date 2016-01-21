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
  # by catchSkip and not be treated as an error.
  # It can be used to pass over steps of a promise chain
  # made unnecessary for some reason
  skip: (reason, context)->
    err = new Error 'skip'
    err.skip = true
    err.reason = reason
    err.context = context
    throw err

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
promisesHandlers.catchSkip = (label)->
  catcher = (err)->
    if err.skip then _.log err.context, "#{label} skipped: #{err.reason}"
    else throw err

module.exports = _.extend {}, shared, requests, promisesHandlers, settlers
