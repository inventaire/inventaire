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
tmpPath = (filename)-> '/tmp/' + filename

module.exports =
  putImage: (path, filename, type = 'image/jpeg')->
    fs_.readFile path
    .then writeFile.bind(null, filename)

  deleteImages: (urls, headers)->
    promises = urls.map (url)->
      filename = url.split(base)[1]
      fs_.move filePath(filename), tmpPath(filename)

writeFile = (filename, file)->
  path = filePath filename
  url = fileUrl filename
  fs_.writeFile path, file
  .then -> url
