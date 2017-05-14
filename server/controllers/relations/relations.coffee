__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'
error_ = __.require 'lib', 'error/error'
{ Promise } = __.require 'lib', 'promises'

module.exports =
  get: (req, res)->
    unless req.user? then return error_.unauthorizedApiAccess req, res

    Promise.all [
      user_.getUserRelations req.user._id
      user_.getNetworkIds req.user._id
    ]
    .spread (relations, networkIds)->
      delete relations.none
      relations.network = networkIds
      return relations
    .then res.json.bind(res)
    .catch error_.Handler(req, res)

  post: require './post'
