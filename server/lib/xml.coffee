__ = require('config').universalPath
{ Promise } = __.require 'lib', 'promises'
xml2js = require 'xml2js'

module.exports =
  parse: Promise.promisify xml2js.parseString
