import { minimizeSimplifiedSparqlResults, simplifySparqlResults } from 'wikibase-sdk'
import wdk from 'wikibase-sdk/wikidata.org'
import { newError } from '#lib/error/error'
import { wait } from '#lib/promises'
import { requests_ } from '#lib/requests'
import { warn, info } from '#lib/utils/logs'
import type { AbsoluteUrl, Url } from '#server/types/common'

// Wikidata Query Service limits to 5 concurrent requests per IP
// see https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual#Query_limits
const maxConcurrency = 4
let waiting = 0
let ongoing = 0

const { sparqlQuery } = wdk

interface SparqlRequestOptions {
  minimize?: boolean
}

export async function makeSparqlRequest <Row> (sparql: string, options: SparqlRequestOptions = {}): Promise<Row[]> {
  const url = sparqlQuery(sparql) as AbsoluteUrl

  if (waiting > 500) {
    throw newError('too many requests in queue', 500, { sparql })
  }

  async function persistentRequest () {
    try {
      return await makeRequest<Row>(url, options)
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

async function makeRequest <Row> (url: Url, options: SparqlRequestOptions = {}) {
  logStats()
  waiting += 1

  async function makePatientRequest () {
    if (ongoing >= maxConcurrency) {
      await wait(100)
      return makePatientRequest()
    }

    waiting -= 1
    ongoing += 1
    try {
      // Don't let a query block the queue more than 30 seconds
      const results = await requests_.get(url, { timeout: 30000 })
      const simplifiedResults = simplifySparqlResults(results)
      if (options.minimize) {
        return minimizeSimplifiedSparqlResults(simplifiedResults) as Row[]
      } else {
        return simplifiedResults as Row[]
      }
    } finally {
      ongoing -= 1
      logStats()
    }
  }

  return makePatientRequest()
}

function logStats () {
  if (waiting > 0) {
    info({ waiting, ongoing }, 'wikidata sparql requests queue stats')
  }
}
