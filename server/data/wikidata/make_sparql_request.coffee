CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
{ wait } = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
wdk = require 'wikidata-sdk'
requestOptions =
  headers:
    # Required to avoid getting a 403
    # See https://meta.wikimedia.org/wiki/User-Agent_policy
    'user-agent': CONFIG.name

# Wikidata Query Service limits to 5 concurrent requests per IP
# see https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual#Query_limits
maxConcurrency = 4
waiting = 0
ongoing = 0

module.exports = (sparql)->
  url = wdk.sparqlQuery sparql

  if waiting > 50
    return error_.reject 'too many requests in queue', 500, { sparql }

  persistentRequest = ->
    makeRequest url
    .catch (err)->
      if err.statusCode is 429
        _.warn url, "#{err.message}: retrying in 2s"
        return wait(2000).then persistentRequest
      else
        throw err

  return persistentRequest()

makeRequest = (url)->
  logStats()
  waiting += 1

  makePatientRequest = ->
    if ongoing >= maxConcurrency
      return wait(100).then makePatientRequest

    waiting -= 1
    ongoing += 1
    requests_.get url, requestOptions
    .then wdk.simplifySparqlResults
    # Don't let a query block the queue more than 30 seconds
    .timeout 30000
    .finally ->
      ongoing -= 1
      logStats()

  return makePatientRequest()

logStats = ->
  if waiting > 0 then _.info { waiting, ongoing }, 'wikidata sparql requests queue stats'
