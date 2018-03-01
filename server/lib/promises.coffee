CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

# Here should be the only direct require of bluebird
# so that every other dependency to it passed through this file
# and get the associated configuration
# Exception: cases when this policy would produce dependecy loops
Promise = require 'bluebird'
Promise.config CONFIG.bluebird

requests = require './requests'
shared = __.require('sharedLibs', 'promises')(Promise)
{ resolved } = shared

promisesHandlers =
  Promise: Promise
  all: Promise.all
  props: Promise.props
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

  # a proxy to Bluebird Promisify that keeps the names
  promisify: (mod, keys)->
    # Allow to pass an array of the desired keys
    # or let keys undefined to get all the keys
    unless _.isArray keys then keys = Object.keys mod
    API = {}
    for k in keys
      API[k] = Promise.promisify mod[k]
    return API

  # source: http://bluebirdjs.com/docs/api/deferred-migration.html
  defer: ->
    # Initialize in the defer function scope
    resolve = null
    reject = null

    promise = new Promise (resolveFn, rejectFn)->
      # Set the previously initialized variables
      # to the promise internal resolve/reject functions
      resolve = resolveFn
      reject = rejectFn

    return {
      # A function to resolve the promise at will:
      # the promise will stay pending until 'resolve' or 'reject' is called
      resolve,
      reject,
      # The promise object, still pending at the moment this is returned
      promise
    }

  fallbackChain: (getters, timeout = 10000)->
    _.types getters, 'functions...'
    promiseChainInitializer = Promise.reject new Error(initMessage)
    return getters.reduce ChainReducer(timeout), promiseChainInitializer

initMessage = 'init chain'
ChainReducer = (timeout)-> (prev, next)->
  prev
  .catch (err)->
    # The promiseChainInitializer will always reject its promise to init the fallback chain
    # so logging its error message would be useless
    if err.message isnt initMessage then _.warn err, 'err in the fallback chain'
    return next().timeout timeout

# bundling NonSkip and _.Error handlers
promisesHandlers.catchSkip = (label)->
  catcher = (err)->
    if err.skip then _.log err.context, "#{label} skipped: #{err.reason}"
    else throw err

module.exports = _.extend {}, shared, requests, promisesHandlers
