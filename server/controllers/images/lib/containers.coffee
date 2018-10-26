CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
images_ = __.require 'lib', 'images'
putImage = require './put_image'

containerPutImage = (container, fnName, extension)-> (fileData)->
  { id, path } = fileData

  images_[fnName](path)
  .then -> images_.getHashFilename path, extension
  .then (filename)-> putImage container, path, id, filename

module.exports =
  users:
    putImage: containerPutImage 'users', 'shrink', 'jpg'

  entities:
    putImage: containerPutImage 'entities', 'removeExif', null
