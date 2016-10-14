__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
# wdQuery = __.require 'data', 'wikidata/query'
wikipediaExtract = __.require 'data', 'wikipedia/extract'
isbnData = __.require 'data', 'isbn'

module.exports.get = (req, res, next)->
  { api, isbn } = req.query
  if _.isNonEmptyString isbn then return isbnData req, res

  switch api
    # when 'wd-query' then return wdQuery req, res
    when 'wp-extract' then return wikipediaExtract req, res
    else error_.bundle req, res, 'unknown data provider', 400, req.query
