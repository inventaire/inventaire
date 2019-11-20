const CONFIG = require('config')
const __ = CONFIG.universalPath
const fs_ = __.require('lib', 'fs')
const { local: localStorage } = CONFIG.mediaStorage
const storageFolder = localStorage.folder()

const filePath = (container, filename) => `${storageFolder}/${container}/${filename}`

module.exports = {
  putImage: (container, path, filename) => {
    return fs_.mv(path, filePath(container, filename))
    .then(() => `/img/${container}/${filename}`)
  }
}
