CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

module.exports =
  get: (req, res, next)-> res.json {server: 'GET OK'}
  post: (req, res, next)->
    _.info req.body
    res.json {server: 'POST OK', body: req.body}
  delete: (req, res, next)->
    _.info req.body, 'body'
    _.info req.query, 'query'
    res.json {server: 'DELETE OK', body: req.body}