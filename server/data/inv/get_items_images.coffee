__ = require('config').root
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'

module.exports = (entityUri)->
  items_.picturesByEntity entityUri
  .then parsePictures
  .then _.Log('items images')

parsePictures = (pictures)->
  _(pictures)
  .flatten()
  .compact()
  .uniq()
  .value()
