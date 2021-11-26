const error_ = require('lib/error/error')
const { isRestrictedHost } = require('lib/network')
const fetch = require('node-fetch')

const sanitization = {
  url: {}
}

// Get an image data-url from a URL
const controller = async ({ url }) => {
  console.log('HERE')
  const dataUrl = await getImageDataUrl(url)
  console.log('THERE')
  return { 'data-url': dataUrl }
}

const headers = {
  accept: 'image/*'
}

const getImageDataUrl = async url => {
  if (await isRestrictedHost(url)) {
    throw error_.newInvalid('url', url)
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
