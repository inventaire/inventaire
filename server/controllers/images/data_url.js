const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const sanitize = require('lib/sanitize/sanitize')
const fetch = require('node-fetch')

const sanitization = {
  url: {}
}

// Get an image data-url from a URL
module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { url } = params
    return getImageDataUrl(url)
  })
  .then(responses_.Wrap(res, 'data-url'))
  .catch(error_.Handler(req, res))
}

// Set encoding as null to get the response as a buffer
// see https://stackoverflow.com/a/17133012/3324977
const getImageDataUrl = async url => {
  const res = await fetch(url)
  const contentType = res.headers.get('content-type')

  if (contentType.split('/')[0] !== 'image') {
    throw error_.new('invalid content type', 400, { url, contentType })
  }

  const body = await res.buffer()
  const buffer = body.toString('base64')
  return `data:${contentType};base64,${buffer}`
}
