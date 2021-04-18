const _ = require('builders/utils')
const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const sanitize = require('lib/sanitize/sanitize')
const { getImageByUrl: rewriteImageUrl } = require('data/dataseed/dataseed')
const { enabled: dataseedEnabled } = require('config').dataseed
const convertImageUrl = require('./lib/convert_image_url')

const sanitization = {
  url: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(convertUrl)
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}

const convertUrl = async ({ url }) => {
  const originalUrl = url
  if (dataseedEnabled) {
    const res = await rewriteImageUrl(url)
    url = res.url
  }
  if (!_.isUrl(url)) {
    throw error_.new('invalid image url', 400, { url, originalUrl })
  }
  const data = await convertImageUrl(url)
  _.log({ originalUrl, cleanedUrl: url, ...data }, 'convert url')
  return data
}
