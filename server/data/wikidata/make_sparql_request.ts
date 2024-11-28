import { minimizeSimplifiedSparqlResults, simplifySparqlResults } from 'wikibase-sdk'
import wdk from 'wikibase-sdk/wikidata.org'
import { cache_ } from '#lib/cache'
import { newError } from '#lib/error/error'
import { wait } from '#lib/promises'
import { requests_ } from '#lib/requests'
import { serverMode } from '#lib/server_mode'
import { getHashCode } from '#lib/utils/base'
import { warn, info } from '#lib/utils/logs'
import type { AbsoluteUrl } from '#types/common'

// Wikidata Query Service limits to 5 concurrent requests per IP
// see https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual#Query_limits
const maxConcurrency = 4
let waiting = 0
let ongoing = 0

const { sparqlQuery } = wdk

interface SparqlRequestOptions {
  minimize?: boolean
  timeout?: number
  noHostBanOnTimeout?: boolean
}

export async function makeSparqlRequest <Row> (sparql: string, options: SparqlRequestOptions = {}): Promise<Row[]> {
  const url = sparqlQuery(sparql) as AbsoluteUrl

  if (serverMode && waiting > 500) {
    throw newError('too many requests in queue', 500, { sparql })
  }

  async function persistentRequest () {
    try {
      return await makeRequest<Row>(url, options)
    } catch (err) {
      if (err.statusCode === 429) {
        const { retryAfter = 2 } = err
        warn(url, `${err.message}: retrying in ${retryAfter}s`)
        await wait(retryAfter * 1000)
        return persistentRequest()
      } else {
        throw err
      }
    }
  }

  return persistentRequest()
}

async function makeRequest <Row> (url: AbsoluteUrl, options: SparqlRequestOptions = {}) {
  logStats()
  waiting += 1
  const { timeout = 30000, noHostBanOnTimeout } = options

  async function makePatientRequest () {
    if (ongoing >= maxConcurrency) {
      // TODO: replace with a proper first-in-first-out queuing mechanism
      // such as a semaphore https://github.com/vercel/async-sema
      await wait(100)
      return makePatientRequest()
    }

    waiting -= 1
    ongoing += 1
    try {
      // Don't let a query block the queue more than 30 seconds
      const results = await requests_.get(url, { timeout, noHostBanOnTimeout })
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

interface CachedSparqlRequestOptions extends SparqlRequestOptions {
  cacheKeyPrefix: string
  ttl: number
  refresh?: boolean
}
export async function makeCachedSparqlRequest <Row> (sparql: string, options: CachedSparqlRequestOptions): Promise<Row[]> {
  const { cacheKeyPrefix, ttl, refresh } = options
  const hash = getHashCode(sparql)
  return cache_.get({
    key: `${cacheKeyPrefix}:${hash}`,
    fn: () => makeSparqlRequest(sparql, options),
    ttl,
    refresh,
  })
}
