import fetch from 'node-fetch'
import { cleanupImageUrl } from '#data/dataseed/dataseed'
import { newError } from '#lib/error/error'
import { newInvalidError } from '#lib/error/pre_filled'
import isPrivateUrl from '#lib/network/is_private_url'
import { endReqTimer, sanitizeUrl, startReqTimer } from '#lib/requests'
import { logError } from '#lib/utils/logs'
import config from '#server/config'

const { enabled: dataseedEnabled } = config.dataseed

const sanitization = {
  url: {},
}

// Get an image data-url from a URL
const controller = async ({ url }) => {
  try {
    const dataUrl = await getImageDataUrl(url)
    return { 'data-url': dataUrl }
  } catch (err) {
    // In case of server-side request forgery, do not let internal services
    // error responses get out
    logError(err, 'data_url private error')
    throw newError('image could not be converted', 400, { url })
  }
}

const headers = {
  accept: 'image/*',
}

const getImageDataUrl = async url => {
  if (await isPrivateUrl(url)) {
    throw newInvalidError('url', url)
  }

  if (dataseedEnabled) {
    const res = await cleanupImageUrl(url)
    url = res.url
  }

  await sanitizeUrl(url)

  const fetchOptions = { headers }
  let res, errorCode
  const timer = startReqTimer('get', url, fetchOptions)
  try {
    res = await fetch(url, { headers })
    const contentType = res.headers.get('content-type')

    if (contentType.split('/')[0] !== 'image') {
      throw newError('invalid content type', 400, { url, contentType })
    }

    const body = await res.buffer()
    const buffer = body.toString('base64')
    return `data:${contentType};base64,${buffer}`
  } catch (err) {
    errorCode = err.code || err.type || err.name || err.message
    throw err
  } finally {
    endReqTimer(timer, res?.status || errorCode)
  }
}

export default { sanitization, controller }
