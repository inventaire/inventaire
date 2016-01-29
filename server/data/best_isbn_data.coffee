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

  # give priority to inv data as those can be fixed
  # while errors from google can't
  # ex: isbn 9782253005438 is wrong in Google Books
  .then (res)-> res.inv or res.openlibrary or res.google or {}
