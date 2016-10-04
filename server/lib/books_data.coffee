__ = require('config').universalPath

module.exports =
  getDataFromIsbn: __.require 'data', 'best_isbn_data'
  getDataFromText: __.require 'data', 'google/text'
  getImages: __.require 'data', 'get_images'
