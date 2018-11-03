CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
search = __.require 'controllers', 'search/lib/get_wd_authors'
{ prefixifyWd } = __.require 'controllers', 'entities/lib/prefix'

module.exports = (entity)->
  name = _.values(entity.labels)[0]
  unless _.isNonEmptyString(name) then return

  search name, 'humans'
  .then (searchResult)->
    searchResult
    .filter (result)-> result._score > 4
    .map formatResult
  .catch _.ErrorRethrow("#{name} search err")

formatResult = (result)->
  _score: result._score
  uri: prefixifyWd result.id
