__ = require('config').root
_ = __.require 'builders', 'utils'
cache_ = __.require 'lib', 'cache'

promises_ = __.require 'lib', 'promises'
wd_ = __.require 'lib', 'wikidata'

baseUrl = wd_.API.wmflabs.base

module.exports = (res, query)->
  key = "wdq:#{query}"
  cache_.get key, requestWdq.bind(null, query)
  .then res.json.bind(res)
  .catch _.errorHandler.bind(null, res)

requestWdq = (query)->
  url = "#{baseUrl}?q=#{query}"
  promises_.get url