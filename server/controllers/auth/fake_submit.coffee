CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

# allows authentification forms to submit a form already
# validated by XHR calls, in order to be catched by browsers
# password manager or other field suggestions tools
module.exports = (req, res, next)->
  {redirect} = req.query
  {referer} = req.headers
  route = solveRoute redirect, referer
  res.redirect route


# possible redirection parameters by priority
# - a redirect parameter in the query string
# - the referer found in headers
# - the root
solveRoute = (redirect, referer)->
  if redirect? then "/#{redirect}"
  else referer or '/'
