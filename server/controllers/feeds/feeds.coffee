__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'


module.exports =
  get: (req, res, next)->
    { query } = req

    limit = 100

    items_.publicByDate limit
    .then res.json.bind(res)
    .catch error_.Handler(req, res)

