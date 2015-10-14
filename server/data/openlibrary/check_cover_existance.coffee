__ = require('config').root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
cache_ = __.require 'lib', 'cache'
error_ = __.require 'lib', 'error/error'
{ oneMonth } =  __.require 'lib', 'times'

module.exports = (url, maxAge=oneMonth)->
  key = "image:exist:#{url}"
  cache_.get key, checkExistance.bind(null, url), maxAge

checkExistance = (url)->
  promises_.head url
  .then checkHeader.bind(null, url)

checkHeader = (url, headers)->
  contentType = headers['content-type']
  # coupled with OpenLibrary response headers
  if contentType? and contentType is 'image/jpeg'
    return { url: url }
  else
    throw error_.new 'cover not found', 404, url
