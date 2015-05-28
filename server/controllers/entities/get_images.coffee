__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
booksData_ = __.require 'lib', 'books_data'

module.exports = getImages = (req, res)->
  dataArray = req.query.data?.split '|'
  unless dataArray?.length > 0
    return error_.bundle res, 'empty query', 400, req.query

  promises = dataArray.map (data)->
    if data? then booksData_.getImage(data)

  promises_.settle(promises)
  .then res.json.bind(res)
  .catch error_.Handler(res)
