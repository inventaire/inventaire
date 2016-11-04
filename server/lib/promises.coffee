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
    resolve = null
    reject = null
    promise = new Promise -> [ resolve, reject ] = arguments
    return { resolve, reject, promise }

  fallbackChain: (getters, timeout=10000)->
    _.types getters, 'functions...'
    first = true
    p = resolved
    while getters.length > 0
      # Get the next getter and assign a timeout
      next = getters.shift()
      if first
        p = p.then -> next().timeout timeout
        first = false
      else
        # chaining the following options in case the first fails
        p = p.catch (err)->
          _.warn err, 'err in the fallback chain'
          next().timeout timeout
    return p

# bundling NonSkip and _.Error handlers
promisesHandlers.catchSkip = (label)->
  catcher = (err)->
    if err.skip then _.log err.context, "#{label} skipped: #{err.reason}"
    else throw err

module.exports = _.extend {}, shared, requests, promisesHandlers
