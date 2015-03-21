__ = require('config').root
_ = __.require 'builders', 'utils'
books_ = __.require 'lib', 'books'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

module.exports = (req, res, next) ->
  isbns = req.query.isbns?.split '|'
  unless isbns?.length > 0
    return error_.bundle res, 'empty query', 400, req.query

  promises = isbns.map (isbn)-> books_.getDataFromIsbn(isbn)

  promises_.settle(promises)
  .then (data)->
    index = {}
    data.forEach (isbnData)->
      for isbn, v of isbnData
        index[isbn] = v

    res.json(index)
  .catch error_.Handler(res)
