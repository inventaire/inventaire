CONFIG = require('config')
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
cache_ = __.require 'lib', 'cache'
error_ = __.require 'lib', 'error/error'
buildQuery = require './queries/build_query'
requests_ = __.require 'lib', 'requests'
wdk = require 'wikidata-sdk'

queries = require './queries/queries'
possibleQueries = Object.keys queries

# Params:
# - query: the name of the query to use from './queries/queries'
# - refresh
# - custom parameters: see the query file
module.exports = (params)->
  { query:queryName, refresh, dry } = params

  # Converting from kebab case to snake case
  params.query = queryName = queryName.replace /-/g, '_'
  unless queryName in possibleQueries
    return error_.reject 'unknown query', 400, params

  { parameters } = queries[queryName]

  # Every type of query should specify which parameters it needs
  # with keys matching parametersTests keys
  for k in parameters
    value = params[k]
    unless parametersTests[k](value)
      return error_.rejectInvalid k, params

  # Building the cache key
  key = "wdQuery:#{queryName}"
  for k in parameters
    value = params[k]
    key += ":#{value}"

  fn = runQuery.bind null, params, key
  cache_.get { key, fn, refresh, dry, dryFallbackValue: [] }

parametersTests =
  qid: wdk.isItemId
  pid: wdk.isPropertyId

requestOptions =
  headers:
    # Required to avoid getting a 403
    'user-agent': CONFIG.name

runQuery = (params, key)->
  { query:queryName } = params
  url = buildQuery params

  requests_.get url, requestOptions
  .then wdk.simplifySparqlResults
  .catch _.ErrorRethrow(key)
