__ = require('config').universalPath
_ = __.require 'builders', 'utils'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
revertMerge = require './lib/revert_merge'

module.exports = (req, res)->
  { body } = req
  { from:fromUri } = body
  { _id:reqUserId } = req.user

  unless _.isNonEmptyString fromUri
    return error_.bundleMissingBody req, res, 'from'

  [ fromPrefix, fromId ] = fromUri.split ':'

  unless fromPrefix is 'inv' and _.isInvEntityId fromId
    return error_.bundleInvalid req, res, 'from'

  revertMerge reqUserId, fromId
  .then responses_.Send(res)
  .catch error_.Handler(req, res)
