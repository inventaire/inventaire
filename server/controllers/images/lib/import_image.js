const { md5 } = require('lib/crypto')
const downloadFile = require('./download_file')
const { putImage } = require('controllers/images/lib/containers').entities

module.exports = async sourceUrl => {
  const tmpFilename = md5(sourceUrl)
  const tmpPath = `/tmp/${tmpFilename}`

  await downloadFile(sourceUrl, tmpPath)
  return putImage({ path: tmpPath })
}
