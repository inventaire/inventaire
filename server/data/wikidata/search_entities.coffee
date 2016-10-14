__ = require('config').universalPath
_ = __.require 'builders', 'utils'
wdk = require 'wikidata-sdk'
wd_ = __.require 'lib', 'wikidata/wikidata'
cache_ = __.require 'lib', 'cache'

module.exports = (query)->
  { search, lang } = query
  key = "wd:search:#{search}:#{lang}"
  cache_.get key, requestBooksUris.bind(null, search, lang)

requestBooksUris = (search, lang)->
  wd_.searchEntities search
  .then extractWdIds
  .then _.Success('wd ids found')

extractWdIds = (res)-> res.query.search.map _.property('title')
