import { partition, map, zip } from 'lodash-es'
import type { ParsedIsbnData } from '#controllers/entities/lib/get_entities_by_isbns'
import type { EntitiesGetterParams } from '#controllers/entities/lib/get_entities_by_uris'
import { getWikidataEnrichedEntities } from '#controllers/entities/lib/get_wikidata_enriched_entities'
import { makeSparqlRequest } from '#data/wikidata/make_sparql_request'
import { isWdEntityId } from '#lib/boolean_validations'
import { cache_ } from '#lib/cache'
import { normalizeIsbn, toIsbn13 } from '#lib/isbn/isbn'
import { isNotEmpty, objectFromEntries } from '#lib/utils/base'
import { LogError } from '#lib/utils/logs'
import { typesAliases } from '#lib/wikidata/aliases'
import type { NormalizedIsbn, WdEntityId } from '#server/types/entity'

const { works: worksP31Values, editions: editionsP31Values } = typesAliases

const notFoundValue = '0'
type CachedWdIdValue = WdEntityId | typeof notFoundValue

export async function getWdEntitiesByIsbns (isbnsData: ParsedIsbnData[], params: EntitiesGetterParams = {}) {
  // Unless refresh, get cached isbn=>wd pairs
  const { refresh = false } = params
  let allFoundWdIds: WdEntityId[]
  let isbnsToRequest: ParsedIsbnData[]
  if (refresh) {
    allFoundWdIds = []
    isbnsToRequest = isbnsData
  } else {
    const normalizedIsbns = map(isbnsData, 'isbn13')
    const cacheKeys = normalizedIsbns.map(getCacheKey)
    const cachedWdIdValues: (CachedWdIdValue | undefined)[] = await cache_.dryGetMany(cacheKeys)
    const isbnsAndCachedWdUriValues = zip(isbnsData, cachedWdIdValues)
    const [ cached, notCached ] = partition(isbnsAndCachedWdUriValues, ([ , cachedValue ]) => cachedValue != null)
    const found = cached.filter(([ , cachedValue ]) => isWdEntityId(cachedValue))
    allFoundWdIds = found.map(([ , wdId ]) => wdId as WdEntityId)
    isbnsToRequest = notCached.map(([ isbnData ]) => isbnData)
  }

  // Request missing isbn=>wd pairs
  if (isbnsToRequest.length > 0) {
    const wdIdByIsbn = await requestWdIdByIsbns(isbnsToRequest)
    // and cache results individually
    const newCacheEntries: [ string, CachedWdIdValue ][] = isbnsToRequest.map(({ isbn13 }) => {
      const wdId = wdIdByIsbn[isbn13]
      if (wdId) allFoundWdIds.push(wdId)
      return [ getCacheKey(isbn13), wdId || notFoundValue ]
    })
    // No need to wait for this
    cache_.batchPut(newCacheEntries).catch(LogError('error caching wd entities isbns'))
  }

  // Return call to get enriched wd entities
  const wdEntities = await getWikidataEnrichedEntities(allFoundWdIds, params)
  // Remove wd to isbn uri redirections (useful only when requesting from wd uris)
  wdEntities.entities.forEach(entity => delete entity.redirects)
  return wdEntities
}

const getCacheKey = (normalizedIsbn: string) => `wd:isbn:${normalizedIsbn}`

interface Row {
  edition: WdEntityId
  isbn13hs: string
  isbn10hs: string
}

// TODO: handle case where too many isbns are requested at once for a single request
async function requestWdIdByIsbns (isbnsData: ParsedIsbnData[]) {
  const sparql = getQuery(isbnsData)
  const rows = await makeSparqlRequest<Row>(sparql)
  const entries = rows.map(getWdIdAndIsbn).filter(isNotEmpty)
  return objectFromEntries(entries)
}

function getWdIdAndIsbn (row: Row) {
  const { edition } = row
  if (row.isbn13hs) {
    const isbn13hs = row.isbn13hs.split('|')
    if (isbn13hs.length === 1) {
      const isbn13 = normalizeIsbn(isbn13hs[0])
      return [ isbn13, edition ] as [ NormalizedIsbn, WdEntityId ]
    }
  } else if (row.isbn10hs) {
    const isbn10hs = row.isbn10hs.split('|')
    if (isbn10hs.length === 1) {
      const isbn13 = toIsbn13(isbn10hs[0])
      return [ isbn13, edition ] as [ NormalizedIsbn, WdEntityId ]
    }
  }
}

function getQuery (isbnsData: ParsedIsbnData[]) {
  const isbn13hs = map(isbnsData, 'isbn13h')
  const isbn10hs = map(isbnsData, 'isbn10h')
  return `SELECT ?edition (GROUP_CONCAT(?isbn13h;separator="|") AS ?isbn13hs) (GROUP_CONCAT(?isbn10h;separator="|") AS ?isbn10hs) WHERE {
  {
    VALUES (?isbn13h) { ${isbn13hs.map(isbn => `("${isbn}")`).join(' ')} }
    ?edition wdt:P212 ?isbn13h .
   } UNION {
    VALUES (?isbn10h) { ${isbn10hs.map(isbn => `("${isbn}")`).join(' ')} }
    ?edition wdt:P957 ?isbn10h .
  }
  VALUES (?edition_type) { ${editionsP31Values.map(uri => `(${uri})`).join(' ')} }
  ?edition wdt:P31 ?edition_type .
  FILTER EXISTS {
    # (1)
    ?edition wdt:P629 ?work .
    ?edition wdt:P1476 ?title .
  }
  FILTER NOT EXISTS {
    # (2)
    VALUES (?work_type) { ${worksP31Values.map(uri => `(${uri})`).join(' ')} }
    ?edition wdt:P31 ?work_type
  }
}
GROUP BY ?edition`
}

// (1) Filter-out entities that getStrictEntityType will not identify as edition due to the absence of an associated work or a title
// (2) Filter-out entities that getStrictEntityType will not identify as edition due to the type ambiguity