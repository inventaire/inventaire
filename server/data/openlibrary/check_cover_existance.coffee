__ = require('config').root
_ = __.require 'builders', 'utils'
fastimage = require 'fastimage'
cache_ = __.require 'lib', 'cache'
{ oneMonth } =  __.require 'lib', 'times'

module.exports = (url, maxAge=oneMonth)->
  key = "image:exist:#{url}"
  cache_.get key, checkExistance.bind(null, url), maxAge

checkExistance = (url)->
  # default=false makes the server return a 404 instead of a 1x1 image
  # when there is no cover
  urlWithDefault = url + '?default=false'
  fastimage.info urlWithDefault
  .then -> {url: url}
  .catch formatFastImageErr.bind(null, url)

formatFastImageErr = (context, err)->
  if err.httpCode is 404
    throw error_.new 'no cover found', err.httpCode, context
  else
    throw error_.complete err, err.httpCode
