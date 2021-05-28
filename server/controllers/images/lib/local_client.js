const { mv, rm } = require('lib/fs')
const { local: localStorage } = require('config').mediaStorage
const storageFolder = localStorage.folder()

const filePath = (container, filename) => `${storageFolder}/${container}/${filename}`

module.exports = {
  putImage: async (container, path, filename) => {
    await mv(path, filePath(container, filename))
    return `/img/${container}/${filename}`
  },

  deleteImage: async (container, filename) => {
    await rm(filePath(container, filename))
  },
}
