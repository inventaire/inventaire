__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
items_ = __.require 'lib', 'items'
transactions_ = require './lib/transactions'

module.exports = (req, res, nex)->
  {item, message} = req.body
  requester = req.user._id

  _.log [item, message], 'item request'

  unless item? then return error_.bundle res, 'missing item id', 400

  items_.byId item
  .then transactions_.verifyRightToRequest.bind(null, requester)
  .then transactions_.create.bind(null, requester)
  .then _.property('id')
  .then (id)->
    transactions_.addMessage(requester, message, id)
    transactions_.byId(id)
    .then res.json.bind(res)
  .catch error_.Handler(res)
