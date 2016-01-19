__ = require('config').universalPath
_ = __.require 'builders', 'utils'
qs = require 'querystring'
queries =
  'author_works': require './author_works'

module.exports = (key, args...)->
  { query, parser } = queries[key]
  sparql = query.apply null, args

  # removing line-breaks and tabs: doesnt change anything in a sparql query
  # but makes it slightly shorter
  query = qs.escape sparql.replace /(\n|\t)/g, ''

  return data =
    url: "https://query.wikidata.org/sparql?format=json&query=#{query}"
    parser: parser
