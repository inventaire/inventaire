__ = require('config').universalPath
_ = __.require 'builders', 'utils'
cache_ = __.require 'lib', 'cache'
error_ = __.require 'lib', 'error/error'
buildQuery = require './queries/build_query'
promises_ = __.require 'lib', 'promises'
wdk = require 'wikidata-sdk'

queries = require './queries/queries'
possibleQueries = Object.keys queries

module.exports = (req, res)->
  params = req.query
  { query:queryName, refresh } = params

  unless _.isNonEmptyString queryName
    return error_.bundle req, res, 'missing query parameter', 400, params

  # Converting from kebab case to snake case
  params.query = queryName = queryName.replace /-/g, '_'
  unless queryName in possibleQueries
    return error_.bundle req, res, 'unknown query', 400, params

  { parameters } = queries[queryName]

  # Every type of query should specify which parameters it needs
  # with keys matching parametersTests keys
  for k in parameters
    value = params[k]
    unless parametersTests[k](value)
      return error_.bundle req, res, "invalid #{k}", 400, params

  # Invalid the cache by passing refresh=true in the query.
  # Return null if refresh isn't truthy to let the cache set its default value
  timespan = if refresh then 0 else null

  # Building the cache key
  key = "wdQuery:#{queryName}"
  for k in parameters
    value = params[k]
    key += ":#{value}"

  cache_.get key, runQuery.bind(null, params, key), timespan
  .then _.Wrap(res, 'entities')
  .catch error_.Handler(req, res)

parametersTests =
  qid: wdk.isWikidataEntityId
  pid: (pid)-> pid in propertyWhitelist

propertyWhitelist = ['P135', 'P136']

runQuery = (params, key)->
  { query:queryName } = params
  { parser } = queries[queryName]
  url = buildQuery params

  promises_.get url
  .then _.property('results.bindings')
  .then parser
  .then _.Log(key)
  .catch _.ErrorRethrow(key)
