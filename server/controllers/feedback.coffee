__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
radio = __.require 'lib', 'radio'

module.exports =
  post: (req, res, next)->
    { user } = req
    { subject, message, uris, unknownUser } = req.body
    _.log { subject, message, uris, unknownUser }, 'feedback'

    unless subject? or message?
      return error_.bundle req, res, 'message is empty', 400

    if uris?
      for uri in uris
        unless _.isEntityUri uri
          return error_.bundle req, res, 'invalid entity uri', 400, { uri }

    radio.emit 'received:feedback', subject, message, user, unknownUser, uris

    responses_.ok res, 201
