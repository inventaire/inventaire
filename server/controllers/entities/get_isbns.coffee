__ = require('config').root
_ = __.require 'builders', 'utils'
booksData_ = __.require 'lib', 'books_data'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

module.exports = (req, res, next) ->
  isbns = req.query.isbns?.split '|'
  unless isbns?.length > 0
    return error_.bundle res, 'empty query', 400, req.query

  promises = isbns.map booksData_.getDataFromIsbn

  promises_.settle promises
  .then legacyCacheCompatibility
  .then (isbnsData)-> _.indexBy isbnsData, 'isbn'
  .then _.Log('isbnIndex')
  .then res.json.bind(res)
  .catch error_.Handler(res)



# avoiding to delete all the cache by maintaining retrocompatibility
# could be removed once all the cache has been updated
legacyCacheCompatibility = (isbnsData)->
  isbnsData.map (isbnData)->
    # case when the isbnData is returned as a one object index
    # ex: { "9782227479005": {[data]} }
    _.type isbnData, 'object'
    if _.objLength(isbnData) is 1 then _.values(isbnData)[0]
    else isbnData
