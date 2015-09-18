__ = require('config').root
_ = __.require('builders', 'utils')
promises_ = __.require 'lib', 'promises'

getGoogleDataFromIsbn =  __.require 'data', 'google/isbn'
getInvEntitiesDataFromIsbn =  __.require 'data', 'inv/isbn'
getOpenLibraryDataFromIsbn =  __.require 'data', 'openlibrary/isbn'

module.exports = (isbn)->
  promises_.settle [
    getOpenLibraryDataFromIsbn(isbn)
    getGoogleDataFromIsbn(isbn)
    getInvEntitiesDataFromIsbn(isbn)
  ]
  .spread (openlibraryRes, googleRes, invRes)->
    _.log arguments, isbn
    return openlibraryRes or googleRes or invRes or {}
