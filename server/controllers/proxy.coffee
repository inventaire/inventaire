qreq = require 'qreq'
url = require 'url'

module.exports.get = (req, res, next)->
  query = req.originalUrl.slice(7)
  parsed = url.parse(query)
  unless parsed.protocol?
    _.errorHandler res, 'protocol missing', 400
  else
    qreq.get(query)
    .then (resp)->
      res.send(resp.body)
    .fail (err)->
      res.send(err.body)
    .done()