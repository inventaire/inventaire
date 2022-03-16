const _ = require('builders/utils')
const { cleanupImageUrl } = require('data/dataseed/dataseed')
const error_ = require('lib/error/error')
const isPrivateUrl = require('lib/network/is_private_url')
const fetch = require('node-fetch')
const { enabled: dataseedEnabled } = require('config').dataseed

const sanitization = {
  url: {}
}

// Get an image data-url from a URL
const controller = async ({ url }) => {
  try {
    const dataUrl = await getImageDataUrl(url)
    return { 'data-url': dataUrl }
  } catch (err) {
    // In case of server-side request forgery, do not let internal services
    // error responses get out
    _.error(err, 'data_url private error')
    throw error_.new('image could not be converted', 400, { url })
  }
}

const headers = {
  accept: 'image/*'
}

const getImageDataUrl = async url => {
  if (await isPrivateUrl(url)) {
    throw error_.newInvalid('url', url)
  }

  if (dataseedEnabled) {
    const res = await cleanupImageUrl(url)
    url = res.url
  }

  const res = await fetch(url, { headers, sanitize: true })
  const contentType = res.headers.get('content-type')

  if (contentType.split('/')[0] !== 'image') {
    throw error_.new('invalid content type', 400, { url, contentType })
  }

  const body = await res.buffer()
  const buffer = body.toString('base64')
  return `data:${contentType};base64,${buffer}`
}

module.exports = { sanitization, controller }
