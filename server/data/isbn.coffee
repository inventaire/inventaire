__ = require('config').universalPath
_ = __.require 'builders', 'utils'
isbn_ = require('isbn2').ISBN
error_ = __.require 'lib', 'error/error'

module.exports = (req, res)->
  { isbn } = req.query
  data = isbn_.parse isbn

  if data? then res.json data.codes
  else error_.bundle req, res, 'invalid isbn', 400, isbn
