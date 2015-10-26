__ = require('config').root
_ = __.require 'builders', 'utils'
items_ = __.require 'lib', 'items'
user_ = __.require 'lib', 'user/user'
couch_ = require 'inv-couch'
error_ = __.require 'lib', 'error/error'
Promise = require 'bluebird'

publicActions = require './public_actions'

module.exports = _.extend publicActions,
  fetch: (req, res, next) ->
    # only fetch for requesters session
    # = only way to fetch private data on items
    user_.getUserId(req)
    .then items_.byOwner.bind(items_)
    .then res.json.bind(res)
    .catch error_.Handler(res)

  put: (req, res, next) ->
    {_id, rev, title, entity} = req.body
    _.log _id, 'Put Item ID'
    unless _id? then return error_.bundle res, 'missing item id', 400
    unless title? then return error_.bundle res, 'missing item title', 400
    unless entity? then return error_.bundle res, 'missing item entity', 400

    user_.getUserId(req)
    .then (userId)->
      item = req.body
      if item._id is 'new' then items_.create(userId, item)
      else items_.update(userId, item)
    .then couch_.getObjIfSuccess.bind(null, items_.db)
    .then (body)-> res.status(201).json body
    .catch error_.Handler(res)

  del: (req, res, next) ->
    {id, rev} = req.query
    user_.getUserId(req)
    .then items_.verifyOwnership.bind(null, id)
    .then items_.delete.bind(null, id, rev)
    .then res.json.bind(res)
    .catch error_.Handler(res)

  publicActions: (req, res, next)->
    {action} = req.query
    switch action
      when 'public-by-id'
        publicActions.publicById req, res
      when 'public-by-entity'
        publicActions.publicByEntity req, res
      when 'public-by-username-and-entity'
        publicActions.publicByUsernameAndEntity req, res
      when 'last-public-items'
        publicActions.lastPublicItems req, res
      when 'users-public-items'
        publicActions.usersPublicItems req, res
      else error_.unknownAction res
