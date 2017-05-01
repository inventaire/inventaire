__ = require('config').universalPath
_ = __.require 'builders', 'utils'
isbn_ = __.require 'lib', 'isbn/isbn'
error_ = __.require 'lib', 'error/error'
dataseed = __.require 'data', 'dataseed/dataseed'

# An endpoint to get basic facts from an ISBN
# Returns a merge of isbn2 and dataseed data
module.exports = (req, res)->
  { isbn, refresh } = req.query
  data = isbn_.parse isbn

  unless data?
    return error_.bundleInvalid req, res, 'isbn', isbn

  # Not using source to pass the original input as 'source'
  # has another meaning in entities search
  delete data.source
  data.query = isbn

  refresh = _.parseBooleanString refresh

  dataseed.getByIsbns data.isbn13, refresh
  .then (resp)->
    seed = resp[0] or {}
    delete seed.isbn
    _.extend data, seed
    res.json data
  .catch error_.Handler(req, res)
