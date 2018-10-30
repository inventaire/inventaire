CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
images_ = __.require 'lib', 'images'
{ maxSize } = CONFIG.mediaStorage.images
request = require 'request'
{ oneYear } =  __.require 'lib', 'times'
oneMB = 1024 ** 2

module.exports = (req, res, url, dimensions)->
  [ width, height ] = dimensions?.split('x') or [ maxSize, maxSize ]
  [ width, height ] = images_.applyLimits width, height

  reqStream = request url

  reqStream
  .on 'response', onResponse(reqStream, url, width, height, req, res)
  .on 'error', error_.Handler(req, res)

onResponse = (reqStream, url, width, height, req, res)-> (response)->
  { statusCode, statusMessage } = response
  { 'content-type':contentType, 'content-length':contentLength } = response.headers

  if statusCode >= 400
    errMessage = "Remote response: #{statusCode} #{statusMessage}"

  else if not validImageContentType.test(contentType)
    errMessage = "invalid image content-type: #{contentType}"

  else if contentLength > 10 * oneMB
    errMessage = "image is too large: #{contentLength}"

  if errMessage?
    # Keep the internal service host private
    context = url.replace /(\d{1,3}\.){3}(\d{1,3}):\d{4}/, 'internal-host'
    statusCode = if statusCode is 404 then 404 else 400
    err = error_.new errMessage, statusCode, context
    err.privateContext = url
    @emit 'error', err
  else
    res.header 'Content-Type', 'image/jpeg'
    res.header 'Cache-Control', "public, max-age=#{oneYear}"
    resizeFromStream reqStream, width, height, req, res

# Accepting image/*
# Accepting application/octet-stream (known case: media storages 'dumb' content type)
validImageContentType = /^(image\/[\w\+]+|application\/octet-stream)$/

resizeFromStream = (reqStream, width, height, req, res)->
  alreadySent = false

  handleBufferError = (buf)->
    err = new Error buf.toString()
    error_.handler req, res, err
    alreadySent = true

  images_.shrinkStream reqStream, width, height
  .stream (err, stdout, stderr)->
    if err? then return error_.handler req, res, err
    stdout.on 'error', handleBufferError
    stderr.on 'data', handleBufferError

    # Non of the above seem to catch errors for the case when graphicsmagick
    # isn't installed, so instead of doing `stdout.pipe(res)`, we check
    # if data was actually passed before determining if it is a success
    # or an error
    receivedData = false
    stdout.on 'data', (data)->
      receivedData = true
      res.write data

    stdout.on 'close', (data)->
      # Addresses the case when the response was already sent by an error handler
      if alreadySent then return
      if receivedData then res.end()
      # usually solved by `sudo apt-get install graphicsmagick`
      else
        message = 'empty graphicsmagick response: make sure graphicsmagick is installed'
        error_.bundle req, res, message , 500
