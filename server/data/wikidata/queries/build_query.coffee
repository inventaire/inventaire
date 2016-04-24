__ = require('config').universalPath
_ = __.require 'builders', 'utils'
qs = require 'querystring'

queries = require './queries'

module.exports = (params)->
  { query:queryName } = params
  { query:queryBuilder } = queries[queryName]
  sparql = queryBuilder params

  # removing line-breaks and tabs: doesnt change anything in a sparql query
  # but makes it slightly shorter
  sparql = qs.escape sparql.replace(/(\n|\t)/g, '')

  return "https://query.wikidata.org/sparql?format=json&query=#{sparql}"
