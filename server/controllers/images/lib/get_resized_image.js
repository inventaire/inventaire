const _ = require('builders/utils')
const error_ = require('lib/error/error')
const images_ = require('lib/images')
const { userAgent } = require('lib/requests')
const { mediaStorage } = require('config')
const { maxSize } = mediaStorage.images
const { publicURL } = mediaStorage.swift
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
    const context = url
      // Keep IPs private
      .replace(/(\d{1,3}\.){3}(\d{1,3}):\d{4}/, 'internal-host')
      // Prevent leaking media container URLs
      .replace(publicURL, 'swift-storage')
    statusCode = statusCode === 404 ? 404 : 400
    const err = error_.new(errMessage, statusCode, context)
    err.privateContext = url
    error_.handler(req, res, err, statusCode)
  } else {
    res.header('content-type', 'image/jpeg')
    res.header('cache-control', 'immutable')
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
    if (transmittedData || alreadySent) {
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
      if (alreadySent) return
      res.write(data)
      transmittedData = true
    })

    stdout.on('close', () => {
      // Addresses the case when the response was already sent by an error handler
      if (alreadySent) return
      if (transmittedData) {
        res.end()
        alreadySent = true
      // usually solved by `sudo apt-get install graphicsmagick`
      } else {
        const message = 'empty graphicsmagick response: make sure graphicsmagick is installed'
        error_.bundle(req, res, message, 500)
      }
    })
  })
}
