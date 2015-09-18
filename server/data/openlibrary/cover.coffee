# a service to know if a cover is available
# could actually be turned into a generalist 'image-check' service
__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
checkCoverExistance = require './check_cover_existance'

{ coverByOlId } = require './api'


module.exports = (req, res)->
  { id, type } = req.query
  unless id?
    return error_.bundle res, 'no openlibrary id provided', 400

  if type?
    switch type
      when 'author' then type = 'a'
      when 'book' then type = 'b'
      else return error_.bundle res, 'unknow openlibrary type', 400

  url = coverByOlId id, type

  checkCoverExistance url
  .then res.json.bind(res)
  .catch error_.Handler(res)
