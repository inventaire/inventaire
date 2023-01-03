import wdk from 'wikidata-sdk'
import _ from '#builders/utils'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { cache_ } from '#lib/cache'
import { error_ } from '#lib/error/error'
import { radio } from '#lib/radio'
import { info, LogErrorAndRethrow } from '#lib/utils/logs'
import makeSparqlRequest from './make_sparql_request.js'
import { queries, queriesPerProperty } from './queries/queries.js'

const possibleQueries = Object.keys(queries)
const dashesPattern = /-/g

// Params:
// - query: the name of the query to use from './queries/queries.js'
// - refresh
// - custom parameters: see the query file
export default async params => {
  const { refresh, dry } = params
  let { query: queryName } = params

  // Converting from kebab case to snake case
  queryName = params.query = queryName.replace(dashesPattern, '_')
  if (!possibleQueries.includes(queryName)) {
    throw error_.new('unknown query', 400, params)
  }

  validateValues(queryName, params)

  const key = buildKey(queryName, params)

  const fn = runQuery.bind(null, params, key)
  return cache_.get({ key, fn, refresh, dry, dryFallbackValue: [] })
}

const validateValues = (queryName, params) => {
  // Every type of query should specify which parameters it needs
  // with keys matching parametersTests keys
  for (const k of queries[queryName].parameters) {
    const value = params[k]
    if ((parametersTests[k] != null) && !parametersTests[k](value)) {
      throw error_.newInvalid(k, params)
    }
  }
}

const buildKey = (queryName, params) => {
  // Building the cache key
  let key = `wdQuery:${queryName}`
  for (const k of queries[queryName].parameters) {
    let value = params[k]
    // Known case: resolve_external_ids expects an array of [ property, value ] pairs
    if (!_.isString(value)) value = JSON.stringify(value)
    key += `:${value}`
  }
  return key
}

const parametersTests = {
  qid: wdk.isItemId,
  pid: wdk.isPropertyId,
}

const runQuery = (params, key) => {
  const { query: queryName } = params
  const sparql = queries[queryName].query(params)

  return makeSparqlRequest(sparql)
  .catch(LogErrorAndRethrow(key))
}

radio.on('invalidate:wikidata:entities:relations', async invalidatedQueriesBatch => {
  const keys = invalidatedQueriesBatch.flatMap(getQueriesKeys)
  info(keys, 'invalidating queries cache')
  await cache_.batchDelete(keys)
})

const getQueriesKeys = ({ property, valueUri }) => {
  const queriesToInvalidate = (queriesPerProperty[property] || [])
    // Add queries that should be invalidated for any property
    .concat(queriesPerProperty['*'])
  const pid = unprefixify(property)
  const qid = unprefixify(valueUri)
  return queriesToInvalidate.map(queryName => buildKey(queryName, { pid, qid }))
}
