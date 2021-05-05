require('should')
const CONFIG = require('config')
const { mediaStorage } = CONFIG
const host = CONFIG.fullPublicHost()
mediaStorage.mode.should.equal('local')
const localStorageFolder = mediaStorage.local.folder()
const randomString = require('lib/utils/random_string')
const fs = require('fs')
const downloadFile = require('controllers/images/lib/download_file')
const { authReq, getUser } = require('../utils/utils')
const { createReadStream } = require('fs')
const fetch = require('node-fetch')
const FormData = require('form-data')
const assert_ = require('lib/utils/assert_types')

const uploadImageFromUrl = async ({ container, url }) => {
  return authReq('post', '/api/images?action=convert-url', { container, url })
}

const someImageUrl = () => `https://via.placeholder.com/1000x1000.jpg?text=${randomString(10)}`

module.exports = {
  getImageDataUrl: async url => {
    url = encodeURIComponent(url)
    const { 'data-url': dataUrl } = await authReq('get', `/api/images?action=data-url&url=${url}`)
    return dataUrl
  },

  importSomeImage: async ({ container }) => {
    return uploadImageFromUrl({
      container,
      url: someImageUrl()
    })
  },

  uploadSomeImage: async ({ container }) => {
    const tmpPath = `/tmp/${randomString(10)}.jpg`
    await downloadFile(someImageUrl(), tmpPath)
    const { cookie } = await getUser()
    const form = new FormData()
    form.append('somefile', createReadStream(tmpPath))
    const res = await fetch(`${host}/api/images?action=upload&container=${container}`, {
      method: 'post',
      headers: { cookie, ...form.getHeaders() },
      body: form,
    })
    const { somefile } = await res.json()
    return {
      statusCode: res.status,
      url: somefile
    }
  },

  localContainerHasImage: ({ container, hash, url }) => {
    if (url) [ container, hash ] = url.split('/').slice(2)
    assert_.string(hash)
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
