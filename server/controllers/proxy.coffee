breq = require 'breq'
url = require 'url'

module.exports.get = (req, res, next)->
  query = req.originalUrl.slice(7)
  parsed = url.parse(query)
  unless parsed.protocol?
    _.errorHandler res, 'protocol missing', 400
  else
    breq.get(query)
    .then (resp)-> res.send(resp.body)
    .catch (err)-> res.send(err.body)
    .done()