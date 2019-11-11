// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const fs = require('fs')

const stat = Promise.promisify(fs.stat)

const getContentLength = src => stat(src)
.get('size')

module.exports = {
  readFile: Promise.promisify(fs.readFile),
  writeFile: Promise.promisify(fs.writeFile),
  createReadStream: fs.createReadStream,
  mv: Promise.promisify(fs.rename),
  getContentLength
}
