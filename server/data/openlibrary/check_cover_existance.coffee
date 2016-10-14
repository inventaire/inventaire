__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

module.exports = (url)->
  promises_.head url
  .then checkHeader.bind(null, url)

checkHeader = (url, res)->
  contentType = res.headers['content-type']
  # Coupled with OpenLibrary response headers
  if contentType? and contentType is 'image/jpeg' then return url
  else throw error_.new 'cover not found', 404, url
