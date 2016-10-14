# a service to know if a cover is available
# could actually be turned into a generalist 'image-check' service
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
checkCoverExistance = require './check_cover_existance'

{ coverByOlId } = require './api'

module.exports = (openLibraryId, entityType)->
  switch entityType
    when 'human' then type = 'a'
    when 'book', 'edition' then type = 'b'
    else return error_.bundle req, res, 'unknow openlibrary type', 400

  url = coverByOlId openLibraryId, type

  checkCoverExistance url
  .then _.Log('open library url found')
  .then (url)->
    url: url
    credits:
      text: 'OpenLibrary'
      url: url
  .catch _.ErrorRethrow('get openlibrary cover err')
