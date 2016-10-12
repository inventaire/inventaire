CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise, defer } = __.require 'lib', 'promises'

# Goal: Make one grouped request return several individual promises
# Use case: we got several entities to fetch on Wikidata at about the same time
# but the requests can't be merged upstream to keep cache per-entity
module.exports = (params)->
  { delay, requester } = params

  keys = []
  groupedPromise = defer()
  timeout = null
  reset = ->
    keys = []
    groupedPromise = defer()
    timeout = null

  getGroupedRequestPromise = ->
    _.log keys, 'grouped keys'
    # If no timeout was set, it's the first request so it triggers the timeout
    # Every next request within this time will be grouped in the same grouped request
    unless timeout then timeout = setTimeout doGroupedRequest, delay
    return groupedPromise.promise

  doGroupedRequest = ->
    groupedPromise.resolve requester(keys)
    reset()

  # This is the request grouped only interface:
  # make a request for a single piece, get the result for this single piece.
  # The request grouper abstract all the rest, namely the request grouping
  return singleRequest = (key)->
    keys.push key

    getGroupedRequestPromise()
    .then _.property(key)
