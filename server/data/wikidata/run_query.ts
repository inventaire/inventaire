import { isString } from 'lodash-es'
import { isPropertyId } from 'wikibase-sdk'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { getReverseClaimCacheKey } from '#controllers/entities/lib/reverse_claims'
import { isWdEntityId } from '#lib/boolean_validations'
import { cache_ } from '#lib/cache'
import { newError } from '#lib/error/error'
import { newInvalidError } from '#lib/error/pre_filled'
import { radio } from '#lib/radio'
import { arrayIncludes } from '#lib/utils/base'
import { info, logError } from '#lib/utils/logs'
import { objectKeys } from '#lib/utils/types'
import { makeSparqlRequest } from './make_sparql_request.js'
import { queries, queriesPerProperty, type QueryReturnTypeByQueryName, type SparqlQueryParams } from './queries/queries.js'

const possibleQueries = objectKeys(queries)

type QueryName = keyof QueryReturnTypeByQueryName

export type RunQueryParams <QN extends QueryName> = SparqlQueryParams & {
  query: QN
  refresh?: boolean
  dry?: boolean
}

// Params:
// - query: the name of the query to use from './queries/queries.js'
// - refresh
// - custom parameters: see the query file
export async function runWdQuery <QN extends QueryName> (params: RunQueryParams<QN>) {
  const { refresh, dry, query: queryName } = params

  if (!arrayIncludes(possibleQueries, queryName)) {
    throw newError('unknown query', 400, { params })
  }

  validateValues(queryName, params)

  const key = buildKey(queryName, params)

  type RT = QueryReturnTypeByQueryName[QN]

  return cache_.get<RT>({
    key,
    fn: () => makeQuery<QN, RT>(params, key),
    refresh,
    dry,
    dryFallbackValue: [] as RT,
  })
}

function validateValues (queryName, params) {
  // Every type of query should specify which parameters it needs
  // with keys matching parametersTests keys
  for (const k of queries[queryName].parameters) {
    const value = params[k]
    if ((parametersTests[k] != null) && !parametersTests[k](value)) {
      throw newInvalidError(k, params)
    }
  }
}

function buildKey (queryName, params) {
  // Building the cache key
  let key = `wdQuery:${queryName}`
  for (const k of queries[queryName].parameters) {
    let value = params[k]
    // Known case: resolve_external_ids expects an array of [ property, value ] pairs
    if (!isString(value)) value = JSON.stringify(value)
    key += `:${value}`
  }
  return key
}

const parametersTests = {
  qid: isWdEntityId,
  pid: isPropertyId,
}

async function makeQuery <QN extends QueryName, RT extends QueryReturnTypeByQueryName[QN]> (params: RunQueryParams<QN>, key: string) {
  const { query: queryName } = params
  const sparql = queries[queryName].query(params)
  const { minimizable = false } = queries[queryName]

  try {
    const results = await makeSparqlRequest(sparql, { minimize: minimizable })
    return results as RT
  } catch (err) {
    logError(err, `${key} query error`)
    throw err
  }
}

radio.on('invalidate:wikidata:entities:relations', async invalidatedQueriesBatch => {
  const keys = invalidatedQueriesBatch.flatMap(getQueriesKeys)
  info(keys, 'invalidating queries cache')
  await cache_.batchDelete(keys)
})

function getQueriesKeys ({ property, valueUri }) {
  const queriesToInvalidate = (queriesPerProperty[property] || [])
  const pid = unprefixify(property)
  const qid = unprefixify(valueUri)
  return queriesToInvalidate
  .map(queryName => buildKey(queryName, { pid, qid }))
  .concat([
    getReverseClaimCacheKey(property, valueUri),
  ])
}
