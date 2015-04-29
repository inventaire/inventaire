__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
request = require './request'
transactions_ = require './lib/transactions'

module.exports =
  fetch: (req, res, next)->
    userId = req.user._id
    transactions_.byUser(userId)
    .then res.json.bind(res)
    .catch error_.Handler(res)

  actions: (req, res, next)->
    { action } = req.body

    switch action
      when 'request' then request(req, res, next)
      else error_.bundle res, 'unknown action', 400
