CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')
{ Promise } = __.require 'lib', 'promises'
fs_ = __.require 'lib', 'fs'
urlBase = CONFIG.images.urlBase()

base = '/public/uploads/'
folder = "client#{base}"
fileUrl = (filename)-> urlBase + filename
filePath = (filename)-> folder + filename
tmpFolderPath = (filename)-> '/tmp/' + filename

module.exports =
  putImage: (path, filename, type = 'image/jpeg')->
    url = fileUrl filename
    fs_.mv path, filePath(filename)
    .then -> url

  deleteImages: (urls, headers)->
    promises = urls.map (url)->
      filename = url.split(base)[1]
      fs_.mv filePath(filename), tmpFolderPath(filename)
