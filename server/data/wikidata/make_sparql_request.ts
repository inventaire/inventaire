import { simplifySparqlResults } from 'wikibase-sdk'
import wdk from 'wikibase-sdk/wikidata.org'
import { error_ } from '#lib/error/error'
import { wait } from '#lib/promises'
import { requests_ } from '#lib/requests'
import { warn, info } from '#lib/utils/logs'

// Wikidata Query Service limits to 5 concurrent requests per IP
// see https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual#Query_limits
const maxConcurrency = 4
let waiting = 0
let ongoing = 0

const { sparqlQuery } = wdk

export async function makeSparqlRequest (sparql) {
  const url = sparqlQuery(sparql)

  if (waiting > 500) {
    throw error_.new('too many requests in queue', 500, { sparql })
  }

  const persistentRequest = async () => {
    try {
      return await makeRequest(url)
    } catch (err) {
      if (err.statusCode === 429) {
        warn(url, `${err.message}: retrying in 2s`)
        await wait(2000)
        return persistentRequest()
      } else {
        throw err
      }
    }
  }

  return persistentRequest()
}

async function makeRequest (url) {
  logStats()
  waiting += 1

  const makePatientRequest = async () => {
    if (ongoing >= maxConcurrency) {
      await wait(100)
      return makePatientRequest()
    }

    waiting -= 1
    ongoing += 1
    try {
      // Don't let a query block the queue more than 30 seconds
      const results = await requests_.get(url, { timeout: 30000 })
      const simplifiedResults = simplifySparqlResults(results, { minimize: true })
      return simplifiedResults
    } finally {
      ongoing -= 1
      logStats()
    }
  }

  return makePatientRequest()
}

const logStats = () => {
  if (waiting > 0) {
    info({ waiting, ongoing }, 'wikidata sparql requests queue stats')
  }
}
