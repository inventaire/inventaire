const _ = require('builders/utils')
const radio = require('lib/radio')
const cache_ = require('lib/cache')
const error_ = require('lib/error/error')
const wdk = require('wikidata-sdk')
const makeSparqlRequest = require('./make_sparql_request')
const { queries, queriesPerProperty } = require('./queries/queries')
const { unprefixify } = require('controllers/entities/lib/prefix')
const possibleQueries = Object.keys(queries)
const dashesPattern = /-/g

// Params:
// - query: the name of the query to use from './queries/queries'
// - refresh
// - custom parameters: see the query file
module.exports = async params => {
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
  pid: wdk.isPropertyId
}

const runQuery = (params, key) => {
  const { query: queryName } = params
  const sparql = queries[queryName].query(params)

  return makeSparqlRequest(sparql)
  .catch(_.ErrorRethrow(key))
}

radio.on('invalidate:wikidata:entities:relations', async ({ property, valueUri }) => {
  const queriesToInvalidate = (queriesPerProperty[property] || [])
    // Add queries that should be invalidated for any property
    .concat(queriesPerProperty['*'])
  const pid = unprefixify(property)
  const qid = unprefixify(valueUri)
  const keys = queriesToInvalidate.map(queryName => buildKey(queryName, { pid, qid }))
  await cache_.batchDelete(keys)
})
