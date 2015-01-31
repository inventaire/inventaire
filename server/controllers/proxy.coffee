__ = require('config').root
_ = __.require 'builders', 'utils'
url = require 'url'
request = require 'request'

module.exports.get = (req, res, next)->
  query = req.originalUrl.replace '/api/proxy/', ''
  parsed = url.parse(query)
  unless parsed.protocol?
    _.errorHandler res, 'protocol missing', 400
  else
    req.pipe(request(query)).pipe(res)
