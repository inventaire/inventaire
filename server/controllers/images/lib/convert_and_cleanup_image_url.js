const _ = require('builders/utils')
const error_ = require('lib/error/error')
const { cleanupImageUrl } = require('data/dataseed/dataseed')
const { enabled: dataseedEnabled } = require('config').dataseed
const convertImageUrl = require('./convert_image_url')
const assert_ = require('lib/utils/assert_types')

module.exports = async ({ container, url }) => {
  assert_.string(container)
  assert_.string(url)
  const originalUrl = url
  if (dataseedEnabled && container === 'entities') {
    const res = await cleanupImageUrl(url)
    url = res.url
  }
  if (!_.isPublicUrl(url)) {
    throw error_.new('invalid image url', 400, { url, originalUrl })
  }
  const data = await convertImageUrl({ container, url })
  _.log({ originalUrl, cleanedUrl: url, ...data }, 'convert url')
  return data
}
