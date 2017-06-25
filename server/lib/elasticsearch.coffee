CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
{ host:elasticHost } = CONFIG.elasticsearch

buildSearcher = (params)->
  { dbBaseName, queryBodyBuilder } = params
  dbName = CONFIG.db.name dbBaseName
  url = "#{elasticHost}/#{dbName}/_search"
  return (query)->
    _.type query, 'string'
    body = queryBodyBuilder query

    promises_.post { url, body }
    .then parseResponse
    .catch formatError
    .catch _.ErrorRethrow("#{dbBaseName} search err")

parseResponse = (res)-> res.hits.hits.map parseHit

# Reshape the error object to be fully displayed when logged by _.warn
formatError = (err)->
  err.body.error.root_cause = err.body.error.root_cause[0]
  err.body = err.body.error
  throw err

parseHit = (hit)->
  { _source:data, _id } = hit
  data._id = _id
  return data

module.exports = { buildSearcher, parseResponse, formatError }
