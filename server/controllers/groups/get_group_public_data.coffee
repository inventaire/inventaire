CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
tests = __.require 'models','tests/common-tests'
promises_ = __.require 'lib', 'promises'
groups_ = require './lib/groups'
user_ = __.require 'lib', 'user/user'
items_ = __.require 'controllers', 'items/lib/items'

module.exports = (req, res)->
  { query } = req
  { action } = query

  handler = getHandler action

  promises_.start()
  .then handler.bind(null, query)
  .then res.json.bind(res)
  .catch error_.Handler(res)

getHandler = (action)->
  handler = switch action
    when 'search' then searchByName
    when 'last' then lastGroups
    else byId

byId = (query)->
  { id } = query
  unless tests.valid 'groupId', id
    throw error_.new 'invalid groupId', 400, id

  groups_.getGroupPublicData id

searchByName = (query)->
  { search } = query
  unless _.isNonEmptyString search
    throw error_.new 'invalid search', 400, search

  groups_.nameStartBy search
  .filter searchable

lastGroups = ->
  groups_.byCreation()
  .filter searchable

searchable = _.property 'searchable'
