__ = require('config').universalPath
_ = __.require('builders', 'utils')
promises_ = __.require 'lib', 'promises'

getGoogleDataFromIsbn =  __.require 'data', 'google/isbn'
getOpenLibraryDataFromIsbn =  __.require 'data', 'openlibrary/isbn'
getInvEntitiesDataFromIsbn =  __.require 'data', 'inv/isbn'

module.exports = (isbn)->
  promises_.settle [
    getOpenLibraryDataFromIsbn(isbn)
    getGoogleDataFromIsbn(isbn)
    getInvEntitiesDataFromIsbn(isbn)
  ]
  .spread (openlibraryRes, googleRes, invRes)->
    return openlibraryRes or googleRes or invRes or {}
