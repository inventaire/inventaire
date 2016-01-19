__ = require('config').universalPath
_ = __.require 'builders', 'utils'
cache_ = __.require 'lib', 'cache'
error_ = __.require 'lib', 'error/error'
buildQuery = require './queries/build_query'
possibleQueries = ['author_works']
promises_ = __.require 'lib', 'promises'

module.exports = (req, res)->
  { query, qid, refresh } = req.query

  try
    _.types [query, qid], 'strings...'
  catch err
    return error_.bundle res, 'bad parameters', 400, err

  # converting from kebab case to snake case
  query = query.replace /-/g, '_'
  unless query in possibleQueries
    return error_.bundle res, 'unknown query', 400, query

  # Invalid the cache by passing refresh=true in the query.
  # Return null if refresh isn't truthy to let the cache set its default value
  timespan = if refresh then 0 else null

  key = "query:#{query}:#{qid}"
  cache_.get key, runQuery.bind(null, query, qid, key), timespan
  .then (items)-> res.json {items: items}
  .catch error_.Handler(res)



runQuery = (query, qid, key)->
  { url, parser } = buildQuery query, qid

  promises_.get url
  .then _.property('results.bindings')
  .then parser
  .then _.Log(key)
  .catch _.ErrorRethrow(key)
