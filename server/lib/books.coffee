__ = require('config').root
_ = __.require('builders', 'utils')

promises_ = require './promises'
module.exports = __.require('sharedLibs','books')(_)

module.exports.getDataFromIsbn = __.require 'data', 'google/isbn'

module.exports.getDataFromText = __.require 'data', 'google/text'

module.exports.getImage =  __.require 'data', 'google/image'