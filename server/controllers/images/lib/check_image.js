const _ = require('builders/utils')
const { imageIsUsed: userImageIsUsed } = require('controllers/user/lib/user')
const { wait } = require('lib/promises')
const assert_ = require('lib/utils/assert_types')
const containers = require('controllers/images/lib/containers')

module.exports = async ({ container, hash, url }) => {
  if (url) hash = url.split('/')[3]
  if (!hash) return
  assert_.string(hash)
  // Give a moment to CouchDB to update its view, no rush
  await wait(1000)
  const isUsed = await checkImagePerContainer[container](hash)
  if (!isUsed) {
    await containers[container].deleteImage(container, hash)
    _.info(`image deleted: ${container}/${hash}`)
  }
}

const checkImagePerContainer = {
  users: userImageIsUsed
}
