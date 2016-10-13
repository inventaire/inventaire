__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
runQuery = require './run_query'

module.exports = (req, res)->
  promises_.try -> runQuery req.query
  .then _.Wrap(res, 'entities')
  .catch error_.Handler(req, res)
