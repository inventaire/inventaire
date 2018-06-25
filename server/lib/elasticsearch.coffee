CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
{ host:elasticHost } = CONFIG.elasticsearch

buildSearcher = (params)->
  { index, dbBaseName, queryBodyBuilder } = params
  index or= CONFIG.db.name dbBaseName

  url = "#{elasticHost}/#{index}/_search"

  return (query, type, limit)->
    _.type query, 'string'

    if _.isNonEmptyString type
      customUrl = url.replace '_search', "#{type}/_search"
    else
      customUrl = url

    body = queryBodyBuilder query, limit

    promises_.post { url: customUrl, body }
    .then parseResponse
    .catch formatError
    .catch _.ErrorRethrow("#{index} #{type} search err")

parseResponse = (res)-> res.hits.hits.map parseHit

# Reshape the error object to be fully displayed when logged by _.warn
formatError = (err)->
  # Directly rethrow errors that aren't from ElasticSearch
  # like ECONNREFUSED errors
  unless err.body? then throw err

  err.body.error.root_cause = err.body.error.root_cause[0]
  err.body = err.body.error
  throw err

parseHit = (hit)->
  { _source:data, _id, _score } = hit
  data._id = _id
  data._score = _score
  return data

module.exports = { buildSearcher, parseResponse, formatError }
