__ = require('config').root
_ = __.require 'builders', 'utils'
url = require 'url'
request = require 'request'
error_ = __.require 'lib', 'error/error'

module.exports.get = (req, res, next)->
  # removing both /api/proxy/public/ and https://inventaire.io/api/proxy/public/
  query = req.originalUrl.split('/api/proxy/public/')[1]
  unless url.parse(query).protocol?
    error_.bundle res, 'protocol missing', 400, query
  else
    req.pipe(request(query)).pipe(res)
