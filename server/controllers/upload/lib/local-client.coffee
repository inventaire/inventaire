# WIP
# * problem:
# the local urls can't be handled by cdn.filter.to
# and we can't get rid of cdn.filter.to before
# having solved the problem of on-the-fly image resizing

CONFIG = require 'config'
__ = CONFIG.root
_ = __.require('builders', 'utils')
Promise = require 'bluebird'
fs = Promise.promisifyAll require('fs')
imagesUrlBase = CONFIG.imagesUrlBase()

base = '/public/uploads/'
folder = "client#{base}"
fileUrl = (filename)-> imagesUrlBase + filename
filePath = (filename)-> folder + filename
tmpPath = (filename)-> '/tmp/' + filename

module.exports =
  putImage: (path, filename, type='image/jpeg')->
    fs.readFileAsync path
    .then writeFile.bind(null, filename)

  deleteImages: (urls, headers)->
    promises = urls.map (url)->
      filename = url.split(base)[1]
      fs.renameAsync filePath(filename), tmpPath(filename)

writeFile = (filename, file)->
  path = filePath filename
  url = fileUrl filename
  fs.writeFileAsync path, file
  .then -> url
