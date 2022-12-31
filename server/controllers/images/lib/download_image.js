import _, { encodeURL } from 'builders/utils'
import fetch from 'node-fetch'
import AbortController from 'abort-controller'
import error_ from 'lib/error/error'
import fs from 'node:fs'
import isValidImageContentType from './is_valid_image_content_type'
const oneMB = Math.pow(1024, 2)

export default async (url, path) => {
  url = encodeURL(url)
  const controller = new AbortController()
  try {
    const response = await fetch(url, {
      timeout: 30000,
      signal: controller.signal,
      headers: {
        accept: 'image/*'
      },
    })
    validateResponse(response, controller, url, path)
    return saveFile(response.body, path)
  } catch (err) {
    _.error(err, 'download image private error')
    throw error_.new('could not download image', 400, { url })
  }
}

const validateResponse = (response, controller, url, path) => {
  let { status: statusCode, statusText } = response
  let { 'content-type': contentType, 'content-length': contentLength } = response.headers.raw()
  contentType = contentType.join(';')

  if (contentLength != null) contentLength = parseInt(contentLength)

  let errMessage
  if (statusCode >= 400) {
    errMessage = `Remote response: ${statusCode} ${statusText}`
  } else if (contentLength != null && contentLength > (10 * oneMB)) {
    errMessage = `image is too large: ${contentLength}`
    statusCode = 400
  } else if (contentLength != null && contentLength < 1000) {
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
