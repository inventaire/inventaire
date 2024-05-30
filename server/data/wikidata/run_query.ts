import { isString } from 'lodash-es'
import { isPropertyId } from 'wikibase-sdk'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { isWdEntityId } from '#lib/boolean_validations'
import { cache_ } from '#lib/cache'
import { newError } from '#lib/error/error'
import { newInvalidError } from '#lib/error/pre_filled'
import { radio } from '#lib/radio'
import { info, LogErrorAndRethrow } from '#lib/utils/logs'
import { makeSparqlRequest } from './make_sparql_request.js'
import { queries, queriesPerProperty, type SparqlQueryParams } from './queries/queries.js'

const possibleQueries = Object.keys(queries)

export type RunQueryParams = SparqlQueryParams & {
  query: string
  refresh?: boolean
  dry?: boolean
}

// Params:
// - query: the name of the query to use from './queries/queries.js'
// - refresh
// - custom parameters: see the query file
export default async function (params: RunQueryParams) {
  const { refresh, dry } = params
  let { query: queryName } = params

  // Converting from kebab case to snake case
  queryName = params.query = queryName.replaceAll('-', '_')
  if (!possibleQueries.includes(queryName)) {
    throw newError('unknown query', 400, { params })
  }

  validateValues(queryName, params)

  const key = buildKey(queryName, params)

  const fn = runQuery.bind(null, params, key)
  return cache_.get({ key, fn, refresh, dry, dryFallbackValue: [] })
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

function runQuery (params: RunQueryParams, key: string) {
  const { query: queryName } = params
  const sparql = queries[queryName].query(params)
  const { minimizable = false } = queries[queryName]

  return makeSparqlRequest(sparql, { minimize: minimizable })
  .catch(LogErrorAndRethrow(key))
}

radio.on('invalidate:wikidata:entities:relations', async invalidatedQueriesBatch => {
  const keys = invalidatedQueriesBatch.flatMap(getQueriesKeys)
  info(keys, 'invalidating queries cache')
  await cache_.batchDelete(keys)
})

function getQueriesKeys ({ property, valueUri }) {
  const queriesToInvalidate = (queriesPerProperty[property] || [])
    // Add queries that should be invalidated for any property
    .concat(queriesPerProperty['*'])
  const pid = unprefixify(property)
  const qid = unprefixify(valueUri)
  return queriesToInvalidate.map(queryName => buildKey(queryName, { pid, qid }))
}
