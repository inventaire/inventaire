# Get an image data-url from a URL

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Promise } = __.require 'lib', 'promises'
breq = require 'bluereq'
host = CONFIG.fullPublicHost()

module.exports = (req, res, next)->
  { url } = req.query

  unless url? then return error_.bundleMissingQuery req, res, 'url'

  url = decodeURIComponent url
  if url[0] is '/' then url = host + url

  unless _.isUrl(url) then return error_.bundleInvalid req, res, 'url', url

  getImageDataUrl url
  .then _.Wrap(res, 'data-url')
  .catch error_.Handler(req, res)

getImageDataUrl = (url)->
  # Set encoding as null to get the response as a buffer
  # see https://stackoverflow.com/a/17133012/3324977
  breq.get { url, encoding: null }
  .then (res)->
    contentType = res.headers['content-type']

    if contentType.split('/')[0] isnt 'image'
      throw error_.new 'invalid content type', 400, url, contentType

    buffer = new Buffer(res.body).toString('base64')
    return "data:#{contentType};base64,#{buffer}"
