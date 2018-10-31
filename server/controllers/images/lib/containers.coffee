CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
images_ = __.require 'lib', 'images'
putImage = require './put_image'

containerPutImage = (container, fnName)-> (fileData)->
  { id, path } = fileData

  images_[fnName](path)
  .then -> images_.getHashFilename path
  .then (filename)-> putImage container, path, id, filename

module.exports =
  users:
    putImage: containerPutImage 'users', 'shrink'

  entities:
    putImage: containerPutImage 'entities', 'removeExif'

  # Placeholder to add 'remote' to the list of containers, when it's actually
  # used to fetch remote images
  remote: {}
