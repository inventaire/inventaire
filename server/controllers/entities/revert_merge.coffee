__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
revertMerge = require './lib/revert_merge'

module.exports = (req, res)->
  { body } = req
  { from:fromUri } = body
  { _id:reqUserId } = req.user

  unless _.isNonEmptyString fromUri
    return error_.bundle req, res, "missing parameter: from", 400, body

  [ fromPrefix, fromId ] = fromUri.split ':'

  unless fromPrefix is 'inv' and _.isInvEntityId fromId
    return error_.bundle req, res, "invalid 'from' uri", 400, body

  revertMerge reqUserId, fromId
  .then res.json.bind(res)
  .catch error_.Handler(req, res)
