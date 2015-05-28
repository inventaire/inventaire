__ = require('config').root
_ = __.require('builders', 'utils')

module.exports =
  getDataFromIsbn: __.require 'data', 'google/isbn'
  getDataFromText: __.require 'data', 'google/text'
  getImage:  __.require 'data', 'google/image'