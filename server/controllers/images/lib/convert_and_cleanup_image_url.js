const _ = require('builders/utils')
const error_ = require('lib/error/error')
const { cleanupImageUrl } = require('data/dataseed/dataseed')
const { enabled: dataseedEnabled } = require('config').dataseed
const convertImageUrl = require('./convert_image_url')
const assert_ = require('lib/utils/assert_types')
const isPrivateUrl = require('lib/network/is_private_url')

module.exports = async ({ container, url }) => {
  assert_.string(container)
  assert_.string(url)
  const originalUrl = url
  if (dataseedEnabled && container === 'entities') {
    const res = await cleanupImageUrl(url)
    url = res.url
  }
  if (!_.isUrl(url) || await isPrivateUrl(url)) {
    throw error_.new('invalid image url', 400, { url, originalUrl })
  }
  const data = await convertImageUrl({ container, url })
  if (bannedHashes.has(data.hash)) return {}
  _.log({ originalUrl, cleanedUrl: url, ...data }, 'convert url')
  return data
}

const bannedHashes = new Set([
  // BNF placeholder
  '34ae223423391eeb6bcd31bf177e77c13aa013a4'
])
