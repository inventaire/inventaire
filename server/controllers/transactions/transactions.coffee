__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
request = require './request'

module.exports =
  actions: (req, res, next)->
    { action } = req.body

    switch action
      when 'request' then request(req, res, next)
      else error_.bundle res, 'unknown action', 400
