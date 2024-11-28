#!/usr/bin/env tsx
import { writeFile } from 'node:fs/promises'
import { difference, intersection, uniq, values, omit, cloneDeep, compact } from 'lodash-es'
import { prefixifyWd, getWdEntityUriNumericId } from '#controllers/entities/lib/prefix'
import { makeCachedSparqlRequest } from '#data/wikidata/make_sparql_request'
import { absolutePath } from '#lib/absolute_path'
import { cache_ } from '#lib/cache'
import { newError } from '#lib/error/error'
import { oneMonth } from '#lib/time'
import { getHashCode, objectEntries } from '#lib/utils/base'
import { info, logError } from '#lib/utils/logs'
import { primaryTypesAliases, type PluralizedEntityType } from '#lib/wikidata/aliases'
import { extendedAliasesQueries, getExtendedAliasesQueriesHash } from '#scripts/entities_extended_types_aliases/extended_type_aliases_queries'
import type { WdEntityId, WdEntityUri } from '#types/entity'

const extendedTypesAliases = cloneDeep(primaryTypesAliases)
const stats = {}

// Force a cache refresh by prefixing this script call with `export INV_REFRESH_ENTITIES_TYPE_EXTENDED_ALIASES=true;`
const refresh = process.env.INV_REFRESH_ENTITIES_TYPE_EXTENDED_ALIASES === 'true'

for (const [ type, sparql ] of objectEntries(extendedAliasesQueries)) {
  let typeExtendedAliases = await getTypeExtendedAliases(type, sparql)
  // Ideally, the following adjustments should be done within the queries
  // but not at the cost of risking to time out
  if (type === 'series') {
    typeExtendedAliases = difference(typeExtendedAliases, extendedTypesAliases.collections)
  } else if (type === 'works') {
    typeExtendedAliases = difference(typeExtendedAliases, [ ...extendedTypesAliases.series, ...extendedTypesAliases.collections ])
  }
  if (type === 'movements' || type === 'genres') {
    typeExtendedAliases = dropOverlaps(type, typeExtendedAliases)
  } else {
    checkOverlaps(type, typeExtendedAliases)
  }
  extendedTypesAliases[type] = typeExtendedAliases.sort(byNumericId)
  stats[type] = typeExtendedAliases.length
}

info(stats, 'entity types aliases counts')

async function getTypeExtendedAliases (type: PluralizedEntityType, sparqlRequests: string | string[]) {
  const sparqlRequestsArray = sparqlRequests instanceof Array ? sparqlRequests : [ sparqlRequests ]
  const hashCode = getHashCode(sparqlRequestsArray.join())
  let extendedUris
  try {
    extendedUris = await cache_.get<WdEntityUri[]>({
      // Use a a hash code in the key to bust outdated results when the query changes
      key: `extended-wd-aliases:${type}:${hashCode}`,
      fn: () => makeQueries(type, sparqlRequestsArray),
      ttl: oneMonth,
      refresh,
    })
  } catch (err) {
    logError(err, `failed to fetch ${type} extended aliases`)
    // Better start without extended uris than to prevent the server to start
    extendedUris = []
  }
  const P31Values = primaryTypesAliases[type]
  return uniq(P31Values.concat(extendedUris))
}

async function makeQueries (type: PluralizedEntityType, sparqlRequests: string[]) {
  info(`Fetching ${type} aliases...`)
  const ids = []
  for (const sparql of sparqlRequests) {
    try {
      const batchIds = await makeCachedSparqlRequest<WdEntityId>(sparql, {
        minimize: true,
        cacheKeyPrefix: `extended-aliases:${type}`,
        noHostBanOnTimeout: true,
        timeout: 60000,
        ttl: oneMonth,
        refresh,
      })
      ids.push(...batchIds)
    } catch (err) {
      // Ignoring crashing subqueries to be more resilient to changes
      // on Wikidata that might make some of those queries fail
      logError(err, `failed query: ${sparql}`)
    }
  }
  // This check is prohibitively expensive to do within queries, but quite cheap when using limit
  // TODO: find a way to bundle those requests while preserving the fast response
  const filteredIds = await Promise.all(uniq(ids).map(async id => {
    if (await hasInstance(id)) return id
  }))
  return compact(filteredIds).map(prefixifyWd)
}

async function hasInstance (id: WdEntityId) {
  const sparql = `SELECT ?instance { ?instance wdt:P31 wd:${id} . } LIMIT 1`
  // Cache those requests for a short time, in case the larger makeQueries call is interrupted
  // to avoid re-doing the same intermediary queries
  const res = await makeCachedSparqlRequest<WdEntityId>(sparql, {
    minimize: true,
    cacheKeyPrefix: `has-instance:${id}`,
    ttl: oneMonth,
    refresh,
  })
  return res.length === 1
}

function checkOverlaps (type: PluralizedEntityType, typeExtendedAliases: WdEntityUri[]) {
  for (const [ otherType, otherTypeExtendedAliases ] of objectEntries(extendedTypesAliases)) {
    if (type !== otherType) {
      const overlap = intersection(typeExtendedAliases, otherTypeExtendedAliases)
      if (overlap.length > 0) {
        throw newError('type aliases overlap', 500, { type, otherType, overlap })
      }
    }
  }
}

function dropOverlaps (type: PluralizedEntityType, typeExtendedAliases: WdEntityUri[]) {
  const otherTypesAliases = values(omit(extendedTypesAliases, type)).flat() as WdEntityUri[]
  return difference(typeExtendedAliases, otherTypesAliases)
}

function byNumericId (a, b) {
  return getWdEntityUriNumericId(a) - getWdEntityUriNumericId(b)
}

const path = absolutePath('server', 'assets/extended_types_aliases.json')
await writeFile(path, JSON.stringify({
  queriesHash: getExtendedAliasesQueriesHash(),
  extendedTypesAliases,
}, null, 2
))
info(`Extended entities types aliases saved in ${path}`)
