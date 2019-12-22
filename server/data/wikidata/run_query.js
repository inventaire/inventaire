const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const cache_ = __.require('lib', 'cache')
const error_ = __.require('lib', 'error/error')
const wdk = require('wikidata-sdk')
const makeSparqlRequest = require('./make_sparql_request')
const queries = require('./queries/queries')
const possibleQueries = Object.keys(queries)
const dashesPattern = /-/g

// Params:
// - query: the name of the query to use from './queries/queries'
// - refresh
// - custom parameters: see the query file
module.exports = params => {
  const { refresh, dry } = params
  let { query: queryName } = params

  // Converting from kebab case to snake case
  queryName = params.query = queryName.replace(dashesPattern, '_')

  if (!possibleQueries.includes(queryName)) {
    return error_.reject('unknown query', 400, params)
  }

  const { parameters } = queries[queryName]

  // Every type of query should specify which parameters it needs
  // with keys matching parametersTests keys
  for (const k of parameters) {
    const value = params[k]
    if ((parametersTests[k] != null) && !parametersTests[k](value)) {
      return error_.rejectInvalid(k, params)
    }
  }

  // Building the cache key
  let key = `wdQuery:${queryName}`
  for (const k of parameters) {
    let value = params[k]
    // Known case: resolve_external_ids expects an array of [ property, value ] pairs
    if (!_.isString(value)) value = JSON.stringify(value)
    key += `:${value}`
  }

  const fn = runQuery.bind(null, params, key)
  return cache_.get({ key, fn, refresh, dry, dryFallbackValue: [] })
}

const parametersTests = {
  qid: wdk.isItemId,
  pid: wdk.isPropertyId
}

const runQuery = (params, key) => {
  const { query: queryName } = params
  const { query: queryBuilder } = queries[queryName]
  const sparql = queryBuilder(params)

  return makeSparqlRequest(sparql)
  .catch(_.ErrorRethrow(key))
}
