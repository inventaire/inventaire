__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
transactions_ = require './lib/transactions'
messages = require './messages'
ActionsControllers = __.require 'lib', 'actions_controllers'

module.exports =
  get: ActionsControllers
    'get-messages': messages.get
    default: sendUserTransactions

  post: ActionsControllers
    'request': require './request'
    'new-message': messages.post

  put: ActionsControllers
    'update-state': require './update_state'
    'mark-as-read': require './mark_as_read'

sendUserTransactions = (req, res)->
  { _id:userId } = req.user
  transactions_.byUser userId
  .then res.json.bind(res)
  .catch error_.Handler(req, res)
