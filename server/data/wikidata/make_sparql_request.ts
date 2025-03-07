import { minimizeSimplifiedSparqlResults, simplifySparqlResults } from 'wikibase-sdk'
import wdk from 'wikibase-sdk/wikidata.org'
import { cache_ } from '#lib/cache'
import { requests_ } from '#lib/requests'
import { getHashCode } from '#lib/utils/base'
import type { AbsoluteUrl } from '#types/common'

const { sparqlQuery } = wdk

interface SparqlRequestOptions {
  minimize?: boolean
  timeout?: number
  noHostBanOnTimeout?: boolean
}

export async function makeSparqlRequest <Row> (sparql: string, options: SparqlRequestOptions = {}): Promise<Row[]> {
  const url = sparqlQuery(sparql) as AbsoluteUrl
  const { timeout = 30000, noHostBanOnTimeout } = options
  // Don't let a query block the queue more than 30 seconds
  const results = await requests_.get(url, { timeout, noHostBanOnTimeout })
  const simplifiedResults = simplifySparqlResults(results)
  if (options.minimize) {
    return minimizeSimplifiedSparqlResults(simplifiedResults) as Row[]
  } else {
    return simplifiedResults as Row[]
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
