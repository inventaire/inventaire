__ = require('config').universalPath
_ = __.require 'builders', 'utils'
wd_ = __.require 'lib', 'wikidata'
cache_ = __.require 'lib', 'cache'

module.exports = (query)->
  { search, lang } = query
  key = "wd:#{search}:#{lang}"
  cache_.get key, requestBooksEntities.bind(null, search, lang)

requestBooksEntities = (search, lang)->
  wd_.searchEntities search
  .then extractWdIds
  .then _.Success('wd ids found')
  .then (ids)-> wd_.getEntities(ids, [lang])
  .then wd_.filterAndBrush

extractWdIds = (res)-> res.query.search.map _.property('title')
