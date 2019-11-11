// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const { wait } = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const wdk = require('wikidata-sdk')
const requestOptions = {
  headers: {
    // Required to avoid getting a 403
    // See https://meta.wikimedia.org/wiki/User-Agent_policy
    'user-agent': CONFIG.name
  }
}

// Wikidata Query Service limits to 5 concurrent requests per IP
// see https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual#Query_limits
const maxConcurrency = 4
let waiting = 0
let ongoing = 0

module.exports = function(sparql){
  const url = wdk.sparqlQuery(sparql)

  if (waiting > 50) {
    return error_.reject('too many requests in queue', 500, { sparql })
  }

  var persistentRequest = () => makeRequest(url)
  .catch((err) => {
    if (err.statusCode === 429) {
      _.warn(url, `${err.message}: retrying in 2s`)
      return wait(2000).then(persistentRequest)
    } else {
      throw err
    }
  })

  return persistentRequest()
}

var makeRequest = function(url){
  logStats()
  waiting += 1

  var makePatientRequest = function() {
    if (ongoing >= maxConcurrency) {
      return wait(100).then(makePatientRequest)
    }

    waiting -= 1
    ongoing += 1
    return requests_.get(url, requestOptions)
    .then(wdk.simplifySparqlResults)
    // Don't let a query block the queue more than 30 seconds
    .timeout(30000)
    .finally(() => {
      ongoing -= 1
      return logStats()
    })
  }

  return makePatientRequest()
}

var logStats = function() {
  if (waiting > 0) { return _.info({ waiting, ongoing }, 'wikidata sparql requests queue stats') }
}
