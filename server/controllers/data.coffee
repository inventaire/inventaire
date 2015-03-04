__ = require('config').root
_ = __.require 'builders', 'utils'

wdq = __.require 'data','wikidata/wdq'


module.exports.get = (req, res, next)->
  {api, q} = req.query
  switch api
    when 'wdq' then return wdq(res, q)
    else _.errorHandler res, "unknown data provider: #{api}", 400
