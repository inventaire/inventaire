__ = require('config').universalPath
_ = __.require 'builders', 'utils'
wdk = require 'wikidata-sdk'
queries = require './queries'

module.exports = (params)->
  { query:queryName } = params
  { query:queryBuilder } = queries[queryName]
  sparql = queryBuilder params
  return wdk.sparqlQuery sparql
