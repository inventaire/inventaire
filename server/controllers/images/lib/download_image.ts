import fs from 'node:fs'
import AbortController from 'abort-controller'
import fetch from 'node-fetch'
import { newError } from '#lib/error/error'
import { endReqTimer, startReqTimer } from '#lib/requests'
import { encodeURL } from '#lib/utils/base'
import { logError } from '#lib/utils/logs'
import isValidImageContentType from './is_valid_image_content_type.js'

const oneMB = Math.pow(1024, 2)

export default async (url, path) => {
  url = encodeURL(url)
  const controller = new AbortController()
  let res, errorCode
  const fetchOptions = {
    timeout: 30000,
    signal: controller.signal,
    headers: {
      accept: 'image/*',
    },
  }
  const timer = startReqTimer('get', url, fetchOptions)
  try {
    res = await fetch(url, fetchOptions)
    validateResponse(res, controller, url, path)
    return await saveFile(res.body, path)
  } catch (err) {
    errorCode = err.code || err.type || err.name || err.message
    logError(err, 'download image private error')
    throw newError('could not download image', 400, { url })
  } finally {
    endReqTimer(timer, res?.status || errorCode)
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
    throw newError(errMessage, statusCode, { url, path })
  }
}

const saveFile = (bodyStream, path) => new Promise((resolve, reject) => {
  const destinationFile = fs.createWriteStream(path)

  bodyStream
  .pipe(destinationFile)
  .on('close', resolve)
  .on('error', reject)
})
