// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const fs_ = __.require('lib', 'fs')
const { local: localStorage } = CONFIG.mediaStorage
const storageFolder = localStorage.folder()

const filePath = (container, filename) => `${storageFolder}/${container}/${filename}`
const tmpFolderPath = filename => `/tmp/${filename}`

module.exports = {
  putImage: (container, path, filename) => {
    return fs_.mv(path, filePath(container, filename))
    .then(() => `/img/${container}/${filename}`)
  },

  deleteImages: (urls, headers) => {
    let promises
    return promises = urls.map(url => {
      const filename = url.split(base)[1]
      return fs_.mv(filePath(filename), tmpFolderPath(filename))
    })
  }
}
