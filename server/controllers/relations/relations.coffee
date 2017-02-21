__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'
error_ = __.require 'lib', 'error/error'

module.exports =
  get: (req, res)->
    user_.getUserRelations req.user._id
    .then res.json.bind(res)
    .catch error_.Handler(req, res)

  post: require './post'
