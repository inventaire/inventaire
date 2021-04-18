const fetch = require('node-fetch')
const AbortController = require('abort-controller')
const error_ = require('lib/error/error')
const { encodeURL } = require('builders/utils')
const fs = require('fs')
const isValidImageContentType = require('./is_valid_image_content_type')
const oneMB = Math.pow(1024, 2)

module.exports = async (url, path) => {
  url = encodeURL(url)
  const controller = new AbortController()
  const response = await fetch(url, { timeout: 30000, signal: controller.signal })
  validateResponse(response, controller, url, path)
  return saveFile(response.body, path)
}

const validateResponse = (response, controller, url, path) => {
  let { status: statusCode, statusText } = response
  let { 'content-type': contentType, 'content-length': contentLength } = response.headers.raw()
  contentType = contentType.join(';')

  if (contentLength != null) contentLength = parseInt(contentLength)

  let errMessage
  if (statusCode >= 400) {
    errMessage = `Remote response: ${statusCode} ${statusText}`
  } else if (!contentLength) {
    errMessage = 'content-length is missing'
    statusCode = 400
  } else if (contentLength > (10 * oneMB)) {
    errMessage = `image is too large: ${contentLength}`
    statusCode = 400
  } else if (contentLength < 1000) {
    errMessage = `image is too small: ${contentLength}`
    statusCode = 400
  } else if (!isValidImageContentType(contentType)) {
    errMessage = `invalid image content-type: ${contentType}`
    statusCode = 400
  }

  if (errMessage != null) {
    controller.abort()
    statusCode = statusCode || 400
    throw error_.new(errMessage, statusCode, { url, path })
  }
}

const saveFile = (bodyStream, path) => new Promise((resolve, reject) => {
  const destinationFile = fs.createWriteStream(path)

  bodyStream
  .pipe(destinationFile)
  .on('close', resolve)
  .on('error', reject)
})
