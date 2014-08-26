qreq = require 'qreq'
url = require 'url'

module.exports.get = (req, res, next)->
  query = req.originalUrl.slice(7).label('sliced url')
  _.logBlue(parsed = url.parse(query), 'parsed')
  unless parsed.protocol?
    _.errorHandler res, 'protocol missing', 400
  else
    qreq.get(query)
    .then (resp)->
      _.logBlue resp.body, 'proxy resp'
      res.send(resp.body)
    .fail (err)->
      _.logRed err.body, 'proxy err'
      res.send(err.body)
    .done()