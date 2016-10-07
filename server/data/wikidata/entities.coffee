__ = require('config').universalPath
_ = __.require 'builders', 'utils'
wdk = require 'wikidata-sdk'
wd_ = __.require 'lib', 'wikidata/wikidata'
prefixify = __.require 'lib', 'wikidata/prefixify'
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
  .then filterAndBrush

extractWdIds = (res)-> res.query.search.map _.property('title')

filterAndBrush = (res)->
  _.values res.entities
  .filter filterWhitelisted

filterWhitelisted = (entity)->
  { P31 } = entity.claims
  unless P31? then return false

  simplifiedP31 = wdk.simplifyPropertyClaims P31
  switch wd_.getType simplifiedP31.map(prefixify)
    when 'book', 'human' then return true
    else return false
