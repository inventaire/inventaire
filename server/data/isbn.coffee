__ = require('config').universalPath
_ = __.require 'builders', 'utils'
isbn_ = __.require 'lib', 'isbn/isbn'
error_ = __.require 'lib', 'error/error'

module.exports = (req, res)->
  { isbn } = req.query
  data = isbn_.parse isbn

  if data? then res.json data
  else error_.bundle req, res, 'invalid isbn', 400, isbn
