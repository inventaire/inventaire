__ = require('config').universalPath
_ = __.require('builders', 'utils')
promises_ = __.require 'lib', 'promises'

getGoogleDataFromIsbn =  __.require 'data', 'google/isbn'
getOpenLibraryDataFromIsbn =  __.require 'data', 'openlibrary/isbn'
getInvEntitiesDataFromIsbn =  __.require 'data', 'inv/isbn'

module.exports = (isbn)->
  promises_.settleProps
    openlibrary: getOpenLibraryDataFromIsbn(isbn)
    google: getGoogleDataFromIsbn(isbn)
    inv: getInvEntitiesDataFromIsbn(isbn)
  .then (res)-> res.openlibrary or res.google or res.inv or {}
