__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
radio = __.require 'lib', 'radio'

module.exports =
  post: (req, res, next)->
    { user } = req
    { subject, message, unknownUser } = req.body
    _.log [subject, message, unknownUser], 'feedback'

    unless subject? or message?
      return error_.bundle req, res, 'message is empty', 400

    radio.emit 'received:feedback', subject, message, user, unknownUser

    _.ok res, 201
