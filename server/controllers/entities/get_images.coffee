__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
booksData_ = __.require 'lib', 'books_data'

module.exports = (req, res)->
  { query } = req
  { entity:entityUri, data } = query
  unless _.isNonEmptyString entityUri
    return error_.bundle res, 'missing entity uri', 400, query

  booksData_.getImages entityUri, data
  .then formatResponse
  .then res.json.bind(res)
  .catch error_.Handler(res)

formatResponse = (results)->
  results = _.compact _.forceArray(results)
  return { images: results }
