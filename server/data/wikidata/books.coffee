__ = require('config').universalPath
_ = __.require('builders', 'utils')
wd_ = __.require 'lib', 'wikidata'
cache_ = __.require 'lib', 'cache'


module.exports = (query)->
  {search, language} = query
  key = "wdBooks:#{search}:#{language}"
  cache_.get key, requestBooksEntities.bind(null, search, language)

requestBooksEntities = (search, language)->
  wd_.searchEntities(search)
  .then extractWdIds
  .then _.Success('wd ids found')
  .then (ids)-> wd_.getEntities(ids, [language])
  .then wd_.filterAndBrush

extractWdIds = (res)->
  res.query.search.map _.property('title')
