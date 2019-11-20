/* eslint-disable
    prefer-const,
*/

// Fix any style issues and re-enable lint.
const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const images_ = __.require('lib', 'images')
const { maxSize } = CONFIG.mediaStorage.images
const request = require('request')
const oneMB = Math.pow(1024, 2)

module.exports = (req, res, url, dimensions) => {
  let [ width, height ] = Array.from((dimensions != null ? dimensions.split('x') : undefined) || [ maxSize, maxSize ]);
  [ width, height ] = Array.from(images_.applyLimits(width, height))

  const reqStream = request(url)

  return reqStream
  .on('response', onResponse(reqStream, url, width, height, req, res))
  .on('error', error_.Handler(req, res))
}

const onResponse = (reqStream, url, width, height, req, res) => response => {
  let errMessage
  let { statusCode, statusMessage } = response
  const { 'content-type': contentType, 'content-length': contentLength } = response.headers

  if (statusCode >= 400) {
    errMessage = `Remote response: ${statusCode} ${statusMessage}`
  } else if (!validImageContentType.test(contentType)) {
    errMessage = `invalid image content-type: ${contentType}`
  } else if (contentLength > (10 * oneMB)) {
    errMessage = `image is too large: ${contentLength}`
  }

  if (errMessage != null) {
    // Keep the internal service host private
    const context = url.replace(/(\d{1,3}\.){3}(\d{1,3}):\d{4}/, 'internal-host')
    statusCode = statusCode === 404 ? 404 : 400
    const err = error_.new(errMessage, statusCode, context)
    err.privateContext = url
    return this.emit('error', err)
  } else {
    res.header('Content-Type', 'image/jpeg')
    res.header('Cache-Control', 'immutable')
    return resizeFromStream(reqStream, width, height, req, res)
  }
}

// Accepting image/*
// Accepting application/octet-stream (known case: media storages 'dumb' content type)
// Ignore charset instructions (known case: image/jpeg;charset=UTF-8)
const validImageContentType = /^(image\/[+\w]+|application\/octet-stream)/

const resizeFromStream = (reqStream, width, height, req, res) => {
  let alreadySent = false

  const handleBufferError = buf => {
    const err = new Error(buf.toString())
    error_.handler(req, res, err)
    alreadySent = true
  }

  return images_.shrinkAndFormatStream(reqStream, width, height)
  .stream((err, stdout, stderr) => {
    if (err != null) return error_.handler(req, res, err)
    stdout.on('error', handleBufferError)
    stderr.on('data', handleBufferError)

    // None of the above seems to catch errors for the case when graphicsmagick
    // isn't installed, so instead of doing `stdout.pipe(res)`, we check
    // if data was actually passed before determining if it is a success
    // or an error
    let receivedData = false
    stdout.on('data', data => {
      receivedData = true
      return res.write(data)
    })

    return stdout.on('close', data => {
      // Addresses the case when the response was already sent by an error handler
      if (alreadySent) return
      if (receivedData) {
        return res.end()
      // usually solved by `sudo apt-get install graphicsmagick`
      } else {
        const message = 'empty graphicsmagick response: make sure graphicsmagick is installed'
        return error_.bundle(req, res, message, 500)
      }
    })
  })
}
