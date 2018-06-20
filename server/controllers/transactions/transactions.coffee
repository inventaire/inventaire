__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
transactions_ = require './lib/transactions'
messages = require './messages'
ActionsControllers = __.require 'lib', 'actions_controllers'

sendUserTransactions = (req, res)->
  { _id:reqUserId } = req.user
  transactions_.byUser reqUserId
  .then responses_.Send(res)
  .catch error_.Handler(req, res)

module.exports =
  get: ActionsControllers
    authentified:
      'default': sendUserTransactions
      'get-messages': messages.get

  post: ActionsControllers
    authentified:
      'request': require './request'
      'new-message': messages.post

  put: ActionsControllers
    authentified:
      'update-state': require './update_state'
      'mark-as-read': require './mark_as_read'
