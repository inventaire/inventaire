require('should')
const { mediaStorage } = require('config')
mediaStorage.mode.should.equal('local')
const localStorageFolder = mediaStorage.local.folder()
const { authReq } = require('./utils')
const randomString = require('lib/utils/random_string')
const fs = require('fs')

const uploadImageFromUrl = async ({ container, url }) => {
  return authReq('post', '/api/images?action=convert-url', { container, url })
}

module.exports = {
  getImageDataUrl: async url => {
    url = encodeURIComponent(url)
    const { 'data-url': dataUrl } = await authReq('get', `/api/images?action=data-url&url=${url}`)
    return dataUrl
  },

  uploadSomeImage: async ({ container }) => {
    const text = randomString(10)
    return uploadImageFromUrl({
      container,
      url: `https://via.placeholder.com/1000x1000.jpg?text=${text}`,
    })
  },

  localContainerHasImage: ({ container, hash }) => {
    const localImagePath = `${localStorageFolder}/${container}/${hash}`
    try {
      // Using the sync method so that consumers can chain this function with ".shoud.be.true()"
      const res = fs.statSync(localImagePath)
      return res != null
    } catch (err) {
      if (err.code === 'ENOENT') return false
      else throw err
    }
  },
}
