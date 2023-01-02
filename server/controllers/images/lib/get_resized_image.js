import CONFIG from 'config'
import fetch from 'node-fetch'
import _ from '#builders/utils'
import { error_ } from '#lib/error/error'
import images_ from '#lib/images'
import { userAgent } from '#lib/requests'

const { mediaStorage } = CONFIG

const { maxSize } = mediaStorage.images
const oneMB = 1024 ** 2
const reqOptions = {
  headers: {
    'user-agent': userAgent,
  },
}

export default async (req, res, url, dimensions) => {
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
    statusCode = statusCode === 404 ? 404 : 400
    const err = error_.new(errMessage, statusCode)
    // Do not pass the URL as error.context in the response to prevent leaking internal information
    // but still get it logged with the error
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
const validImageContentType = /^(image\/[\w+]+|application\/octet-stream)/

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
