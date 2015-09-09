__ = require('config').root
_ = __.require 'builders', 'utils'
url = require 'url'
request = require 'request'
error_ = __.require 'lib', 'error/error'

module.exports.get = (req, res, next)->
  query = req.originalUrl.replace '/api/proxy/public/', ''
  unless url.parse(query).protocol?
    error_.bundle res, 'protocol missing', 400, query
  else
    req.pipe(request(query)).pipe(res)
