__ = require('config').universalPath
_ = __.require 'builders', 'utils'
parseBbox = __.require 'lib', 'parse_bbox'
user_ = __.require 'controllers', 'user/lib/user'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'

module.exports = (req, res)->
  { query } = req
  reqUserId = req.user?._id
  parseBbox query
  .then (bbox)-> user_.getUsersAuthorizedData user_.byPosition(bbox), reqUserId
  .then _.Wrap(res, 'users')
  .catch error_.Handler(req, res)
