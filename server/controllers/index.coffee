CONFIG = require 'config'

module.exports.glob = (req, res, next) ->
  newUrl = CONFIG.protocol + '://' + req.get('Host') + '/#' + req.url
  res.redirect newUrl