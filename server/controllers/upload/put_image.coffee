module.exports =
  putImage: (fileData)->
    { id, path, keepOldFile } = fileData
    # keepOldFile is enabled in ./scripts/upload_jpg
    resizePath = if keepOldFile then "#{path}_resized" else path

    images_.shrink path, resizePath
    .then _.Full(images_.getHashFilename, null, resizePath)
    .then clientPutImage.bind(null, resizePath, id)

  # without image treatments
  putRawImage: (fileData)->
    { id, filename, path } = fileData
    _.log fileData, 'fileData'
    clientPutImage path, id, filename

clientPutImage = (path, id, filename)->
  client.putImage path, filename
  .then _.Log('new image url')
  .then checkRelativeUrl
  .then (url)-> { id, url }

checkRelativeUrl = (url)->
  if /http/.test url then throw error_.new 'not a relative url', 500
  return url
