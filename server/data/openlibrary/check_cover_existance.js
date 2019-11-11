__ = require('config').universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
error_ = __.require 'lib', 'error/error'

module.exports = (url)->
  requests_.head url
  .then checkHeader.bind(null, url)

checkHeader = (url, res)->
  contentType = res.headers['content-type']
  # Coupled with OpenLibrary response headers
  if contentType? and contentType is 'image/jpeg' then return url
  else throw error_.new 'cover not found', 404, url
