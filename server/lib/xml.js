// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const __ = require('config').universalPath
const { Promise } = __.require('lib', 'promises')
const xml2js = require('xml2js')

module.exports =
  { parse: Promise.promisify(xml2js.parseString) }
