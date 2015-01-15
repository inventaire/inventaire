__ = require('config').root
_ = __.require('builders', 'utils')

promises_ = require './promises'
module.exports = __.require('sharedLibs','books')(_)

module.exports.getDataFromIsbn = __.require 'data', 'isbn'

module.exports.getDataFromText = __.require 'data', 'text'

module.exports.getImage =  __.require 'data', 'image'