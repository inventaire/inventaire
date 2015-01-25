__ = require('config').root
_ = __.require 'builders', 'utils'
books_ = __.require 'lib', 'books'
promises_ = __.require 'lib', 'promises'

module.exports = (req, res, next) ->
  isbns = req.query.isbns?.split '|'
  unless isbns?.length > 0
    return _.errorHandler res, 'empty query', 400

  promises = isbns.map (isbn)-> books_.getDataFromIsbn(isbn)

  promises_.settle(promises)
  .then (data)->
    index = {}
    data.forEach (isbnData)->
      for isbn, v of isbnData
        index[isbn] = v

    _.log index, 'get_isbns index'
    res.json(index)
  .catch _.errorHandler.bind(_, res)
