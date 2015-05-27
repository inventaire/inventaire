__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
wdq = __.require 'data','wikidata/wdq'
thumb = __.require 'data','commons/thumb'
wikipediaExtract = __.require 'data','wikipedia/extract'

module.exports.get = (req, res, next)->
  { api } = req.query
  switch api
    when 'wdq' then return wdq(req, res)
    when 'commons-thumb' then return thumb(req, res)
    when 'wp-extract' then return wikipediaExtract(req, res)
    else error_.bundle res, 'unknown data provider', 400, req.query
