/* eslint-disable
    implicit-arrow-linebreak,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const gm = require('gm')
const { Promise } = __.require('lib', 'promises')
const crypto_ = __.require('lib', 'crypto')
const { readFile } =  __.require('lib', 'fs')
const { maxSize, maxWeight } = CONFIG.mediaStorage.images
const error_ = __.require('lib', 'error/error')

const shrinkAndFormat = (data, width, height) => // gm accepts either a path string or a stream
  gm(data)
.setFormat('jpg')
// only resize if bigger
.resize(width, height, '>')
// removing EXIF data
.noProfile()
// replace the alpha layer by a white background
.flatten()
// converting to progressive jpeg
.interlace('Line')

const removeExif = data => gm(data)
.noProfile()

module.exports = {
  getHashFilename(path){
    return readFile(path)
    .then(crypto_.sha1)
  },

  shrinkAndFormat(path, width = maxSize, height = maxSize){
    return new Promise((resolve, reject) => shrinkAndFormat(path, width, height)
    .write(path, returnPath(path, resolve, reject)))
  },

  shrinkAndFormatStream: shrinkAndFormat,

  removeExif(path){
    return new Promise((resolve, reject) => removeExif(path)
    .write(path, returnPath(path, resolve, reject)))
  },

  applyLimits(width, height){
    return [ applyLimit(width), applyLimit(height) ]
  },

  getUrlFromImageHash(container, filename){
    if (filename != null) return `/img/${container}/${filename}`
  }
}

var applyLimit = function(dimension = maxSize){
  dimension = Number(dimension)
  if (dimension > maxSize) { return maxSize
  } else { return dimension }
}

var returnPath = (newPath, resolve, reject) => (function(err) {
  if (err != null) { return reject(err)
  } else { return resolve(newPath) }
})
