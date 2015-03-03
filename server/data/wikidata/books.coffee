__ = require('config').root
_ = __.require('builders', 'utils')
wd_ = __.require 'lib', 'wikidata'
cache_ = __.require 'lib', 'cache'


module.exports = (query)->
 {search, language} = query
 key = "wdBooks:#{search}:#{language}"
 cache_.get key, requestBooksEntities.bind(null, search, language)

requestBooksEntities = (search, language)->
  wd_.searchEntities(search, language)
  .then (res)->
    _.success res, 'searchEntities res'
    if res.success and res.search.length > 0
      return res.search.map (el)-> el.id
    else throw 'not found'
  .then (ids)->
    _.success ids, 'wd ids found'
    wd_.getEntities(ids, [language])
  .then wd_.filterAndBrush