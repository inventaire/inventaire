CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

module.exports =
  get: (req, res, next)->
    _.log req.query, 'query'  unless _.objLength(req.query) is 0
    res.json {server: 'GET OK'}
  post: (req, res, next)->
    _.log req.body, 'body'
    res.json {server: 'POST OK', body: req.body}
  delete: (req, res, next)->
    _.log req.body, 'body'
    _.log req.query, 'query'
    res.json {server: 'DELETE OK', body: req.body}