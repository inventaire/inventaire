module.exports.glob = (req, res, next) ->
  newUrl = req.protocol + '://' + req.get('Host') + '/#' + req.url
  res.redirect newUrl