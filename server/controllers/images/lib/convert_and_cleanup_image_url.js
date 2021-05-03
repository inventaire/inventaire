const _ = require('builders/utils')
const error_ = require('lib/error/error')
const { cleanupImageUrl } = require('data/dataseed/dataseed')
const { enabled: dataseedEnabled } = require('config').dataseed
const convertImageUrl = require('./convert_image_url')

module.exports = async url => {
  const originalUrl = url
  if (dataseedEnabled) {
    const res = await cleanupImageUrl(url)
    url = res.url
  }
  if (!_.isUrl(url)) {
    throw error_.new('invalid image url', 400, { url, originalUrl })
  }
  const data = await convertImageUrl(url)
  _.log({ originalUrl, cleanedUrl: url, ...data }, 'convert url')
  return data
}
