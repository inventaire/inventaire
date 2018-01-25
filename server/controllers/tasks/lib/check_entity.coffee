CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'

error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
{ searchTimeout } = CONFIG
{ host:elasticHost } = CONFIG.elasticsearch
{ buildSearcher, formatError } = __.require 'lib', 'elasticsearch'
prefixify = __.require 'lib', 'wikidata/prefixify'

index = 'wikidata'

queryBodyBuilder = (title)->
  { size: 20, query: { bool: { should: [ { match: { _all: title } } ] } } }

search = buildSearcher { index, queryBodyBuilder }

module.exports = (entity)->
  title = _.values(entity.labels)[0]

  search title, 'humans'
  .then (searchResult)->
    searchResult
    .filter (result)-> result._score > 4
    .map (result)->
      _score: result._score
      uri: prefixify result.id
  .catch _.ErrorRethrow("#{index} #{title} search err")
