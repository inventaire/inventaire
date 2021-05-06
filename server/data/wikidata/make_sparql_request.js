// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const _ = require('builders/utils')
const requests_ = require('lib/requests')
const { wait } = require('lib/promises')
const error_ = require('lib/error/error')
const wdk = require('wikidata-sdk')

// Wikidata Query Service limits to 5 concurrent requests per IP
// see https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual#Query_limits
const maxConcurrency = 4
let waiting = 0
let ongoing = 0

module.exports = async sparql => {
  const url = wdk.sparqlQuery(sparql)

  if (waiting > 500) {
    throw error_.new('too many requests in queue', 500, { sparql })
  }

  const persistentRequest = () => makeRequest(url)
  .catch(err => {
    if (err.statusCode === 429) {
      _.warn(url, `${err.message}: retrying in 2s`)
      return wait(2000).then(persistentRequest)
    } else {
      throw err
    }
  })

  return persistentRequest()
}

const makeRequest = url => {
  logStats()
  waiting += 1

  const makePatientRequest = () => {
    if (ongoing >= maxConcurrency) {
      return wait(100).then(makePatientRequest)
    }

    waiting -= 1
    ongoing += 1
    // Don't let a query block the queue more than 30 seconds
    return requests_.get(url, { timeout: 30000 })
    .then(wdk.simplifySparqlResults)
    .finally(() => {
      ongoing -= 1
      logStats()
    })
  }

  return makePatientRequest()
}

const logStats = () => {
  if (waiting > 0) {
    _.info({ waiting, ongoing }, 'wikidata sparql requests queue stats')
  }
}
