__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
Radio = __.require 'lib', 'radio'
items_ = __.require 'lib', 'items'
transactions_ = __.require 'controllers', 'transactions/lib/transactions'

module.exports =
  actions: (req, res, next)->
    { action } = req.body

    switch action
      when 'request' then request(req, res, next)
      else error_.bundle res, 'unknown action', 400

request = (req, res, nex)->
  {item, message} = req.body
  requester = req.user._id

  _.log [item, message], 'item request'

  unless item? then return error_.bundle res, 'missing item id', 400

  items_.byId item
  .then transactions_.verifyRequesterRight.bind(null, requester)
  .then transactions_.create.bind(null, requester)
  .then _.property('id')
  .then transactions_.addMessage.bind(null, requester, message)
  .then _.Ok(res, 201)
  .catch error_.Handler(res)
