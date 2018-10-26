CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')
{ Promise } = __.require 'lib', 'promises'
fs_ = __.require 'lib', 'fs'
{ local: localStorage } = CONFIG.mediaStorage
storageFolder = localStorage.folder()

filePath = (container, filename)-> "#{storageFolder}/#{container}/#{filename}"
tmpFolderPath = (filename)-> '/tmp/' + filename

module.exports =
  putImage: (container, path, filename)->
    fs_.mv path, filePath(container, filename)
    .then -> "/img/#{container}/#{filename}"

  deleteImages: (urls, headers)->
    promises = urls.map (url)->
      filename = url.split(base)[1]
      fs_.mv filePath(filename), tmpFolderPath(filename)
