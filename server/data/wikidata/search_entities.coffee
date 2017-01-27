__ = require('config').universalPath
_ = __.require 'builders', 'utils'
wd_ = __.require 'lib', 'wikidata/wikidata'
promises_ = __.require 'lib', 'promises'
cache_ = __.require 'lib', 'cache'
qs = require 'querystring'

module.exports = (query)->
  { search, refresh } = query
  _.type search, 'string'
  key = "wd:search:#{search}"
  timestamp = if refresh then 0 else null
  cache_.get key, searchEntities.bind(null, search), timestamp

searchEntities = (search)->
  search = qs.escape search
  url = wd_.API.wikidata.search search
  _.log url, 'searchEntities'

  promises_.get url
  .then extractWdIds
  .then _.Success('wd ids found')

extractWdIds = (res)-> res.query.search.map _.property('title')
