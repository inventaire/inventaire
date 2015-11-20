__ = require('config').universalPath
_ = __.require('builders', 'utils')

module.exports =
  getDataFromIsbn: __.require 'data', 'best_isbn_data'
  getDataFromText: __.require 'data', 'google/text'
  getImages: __.require 'data', 'get_images'
