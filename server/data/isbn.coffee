__ = require('config').universalPath
_ = __.require 'builders', 'utils'
isbn_ = __.require 'lib', 'isbn/isbn'
error_ = __.require 'lib', 'error/error'
dataseed = __.require 'data', 'dataseed/dataseed'

# An endpoint to get basic facts from an ISBN
# Returns a merge of isbn2 and dataseed data
module.exports = (req, res)->
  { isbn } = req.query
  data = isbn_.parse isbn

  unless data?
    return error_.bundle req, res, 'invalid isbn', 400, isbn

  # Not using source to pass the original input as 'source'
  # has another meaning in entities search
  delete data.source
  data.query = isbn

  dataseed.getByIsbns data.isbn13
  .then (resp)->
    seed = resp[0] or {}
    delete seed.isbn
    _.extend data, seed
    res.json data
  .catch error_.Handler(req, res)
