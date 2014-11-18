module.exports.glob = (req, res, next) ->
  newUrl = 'https://' + req.get('Host') + '/#' + req.url
  res.redirect newUrl