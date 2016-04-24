__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
searchByUsername = require './search_by_username'
searchByPositon = require './search_by_position'
getUsersPublicData = require './get_users_public_data'

module.exports = (req, res, next) ->
  { query } = req
  { action, ids } = query
  if action?
    switch action
      when 'get-users' then getUsersPublicData res, ids
      when 'search' then searchByUsername res, query
      when 'search-by-position' then searchByPositon res, query
      else error_.unknownAction res
