CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
search = __.require 'controllers', 'search/lib/get_wd_authors'
prefixify = __.require 'lib', 'wikidata/prefixify'

module.exports = (entity)->
  name = _.values(entity.labels)[0]

  search name, 'humans'
  .then (searchResult)->
    searchResult
    .filter (result)-> result._score > 4
    .map (result)->
      _score: result._score
      uri: prefixify result.id
  .catch _.ErrorRethrow("#{name} search err")
