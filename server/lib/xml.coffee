Promise = require 'bluebird'
xml2js = require 'xml2js'

module.exports =
  parse: Promise.promisify xml2js.parseString