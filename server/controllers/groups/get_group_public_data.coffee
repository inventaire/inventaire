CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
tests = __.require 'models','tests/common-tests'
promises_ = __.require 'lib', 'promises'
groups_ = require './lib/groups'
user_ = __.require 'lib', 'user/user'
items_ = __.require 'controllers', 'items/lib/items'
parseBbox = __.require 'lib', 'parse_bbox'


module.exports = (req, res)->
  { query } = req
  { action } = query

  handler = switch action
    when undefined then byId
    when 'search' then searchByName
    when 'search-by-position' then searchByPositon
    when 'last' then lastGroups

  unless handler? then return error_.unknownAction res

  # wrapping in a promise chain to allow throwing
  # before generating a promise
  promises_.start
  .then handler.bind(null, query)
  .then res.json.bind(res)
  .catch error_.Handler(res)

byId = (query)->
  { id } = query
  unless tests.valid 'groupId', id
    throw error_.new 'invalid group id', 400, id

  groups_.getGroupPublicData id

searchByName = (query)->
  { search } = query
  unless _.isNonEmptyString search
    throw error_.new 'invalid search', 400, search

  groups_.nameStartBy search
  .filter searchable

searchByPositon = (query)->
  parseBbox query
  .then _.Log('searchByPositon latLng')
  .then groups_.byPosition
  .filter searchable

lastGroups = ->
  groups_.byCreation()
  .filter searchable

searchable = _.property 'searchable'
