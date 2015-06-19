__ = require('config').root
_ = __.require('builders', 'utils')
promises_ = __.require 'lib', 'promises'

getGoogleDataFromIsbn =  __.require 'data', 'google/isbn'
getInvEntitiesDataFromIsbn =  __.require 'data', 'inv/isbn'

module.exports = (isbn)->
  promises_.settle [
    getGoogleDataFromIsbn(isbn)
    getInvEntitiesDataFromIsbn(isbn)
  ]
  .spread (googleRes, invRes)->
    _.log googleRes, 'googleRes'
    _.log invRes, 'invRes'
    if googleRes?[isbn]? then googleRes
    else invRes
