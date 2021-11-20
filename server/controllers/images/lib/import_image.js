const error_ = require('lib/error/error')
const { md5 } = require('lib/crypto')
const downloadImage = require('./download_image')
const { containers } = require('controllers/images/lib/containers')

module.exports = async (container, sourceUrl) => {
  if (containers[container] == null || containers[container].putImage == null) {
    throw error_.newInvalid('container', container)
  }

  const tmpFilename = md5(sourceUrl)
  const tmpPath = `/tmp/${tmpFilename}`

  await downloadImage(sourceUrl, tmpPath)
  return containers[container].putImage({ path: tmpPath })
}
