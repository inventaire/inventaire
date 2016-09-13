__ = require('config').universalPath
_ = __.require 'builders', 'utils'
isbn_ = __.require 'lib', 'isbn/isbn'
error_ = __.require 'lib', 'error/error'
getImages = require './get_images'

module.exports = (req, res)->
  { isbn } = req.query
  data = isbn_.parse isbn

  unless data?
    return error_.bundle req, res, 'invalid isbn', 400, isbn

  ip = _.extractReqIp req

  getImages "isbn:#{data.isbn13}", null, ip
  .then (resp)->
    data.image = resp.image
    res.json data
  .catch error_.Handler(req, res)
