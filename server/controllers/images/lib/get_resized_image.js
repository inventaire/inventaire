const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const images_ = __.require('lib', 'images')
const { userAgent } = __.require('lib', 'requests')
const { maxSize } = CONFIG.mediaStorage.images
const fetch = require('node-fetch')
const oneMB = 1024 ** 2
const reqOptions = {
  headers: {
    'user-agent': userAgent
  }
}

module.exports = async (req, res, url, dimensions) => {
  let [ width, height ] = dimensions ? dimensions.split('x') : [ maxSize, maxSize ];
  [ width, height ] = images_.applyLimits(width, height)

  let response
  try {
    response = await fetch(url, reqOptions)
  } catch (err) {
    error_.handler(req, res, err, 500)
    return
  }

  const { statusText } = response
  let { status: statusCode } = response
  const { 'content-type': contentType, 'content-length': contentLength } = response.headers.raw()

  let errMessage
  if (statusCode >= 400) {
    errMessage = `Remote response: ${statusCode} ${statusText}`
  } else if (!validImageContentType.test(contentType)) {
    errMessage = `invalid image content-type: ${contentType}`
  } else if (contentLength > (10 * oneMB)) {
    errMessage = `image is too large: ${contentLength}`
  }

  if (errMessage) {
    // Keep the internal service host private
    const context = url.replace(/(\d{1,3}\.){3}(\d{1,3}):\d{4}/, 'internal-host')
    statusCode = statusCode === 404 ? 404 : 400
    const err = error_.new(errMessage, statusCode, context)
    err.privateContext = url
    error_.handler(req, res, err, statusCode)
  } else {
    res.header('Content-Type', 'image/jpeg')
    res.header('Cache-Control', 'immutable')
    resizeFromStream(response.body, width, height, req, res)
  }
}

// Accepting image/*
// Accepting application/octet-stream (known case: media storages 'dumb' content type)
// Ignore charset instructions (known case: image/jpeg;charset=UTF-8)
const validImageContentType = /^(image\/[+\w]+|application\/octet-stream)/

const resizeFromStream = (imageStream, width, height, req, res) => {
  let alreadySent = false
  let transmittedData = false

  const handleBufferError = buf => {
    const err = new Error(buf.toString())
    if (transmittedData) {
      _.error(err, 'image error after some data was already sent')
    } else {
      error_.handler(req, res, err)
      alreadySent = true
    }
  }

  return images_.shrinkAndFormatStream(imageStream, width, height)
  .stream((err, stdout, stderr) => {
    if (err != null) return error_.handler(req, res, err)
    stdout.on('error', handleBufferError)
    stderr.on('data', handleBufferError)

    // None of the above seems to catch errors for the case when graphicsmagick
    // isn't installed, so instead of doing `stdout.pipe(res)`, we check
    // if data was actually passed before determining if it is a success
    // or an error
    stdout.on('data', data => {
      res.write(data)
      transmittedData = true
    })

    stdout.on('close', () => {
      // Addresses the case when the response was already sent by an error handler
      if (alreadySent) return
      if (transmittedData) {
        res.end()
      // usually solved by `sudo apt-get install graphicsmagick`
      } else {
        const message = 'empty graphicsmagick response: make sure graphicsmagick is installed'
        error_.bundle(req, res, message, 500)
      }
    })
  })
}
