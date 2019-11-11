CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

# Allows authentification forms to submit a form already
# validated by XHR calls, in order to be catched by browsers
# password manager or other field suggestions tools
# Using a different endpoint (/api/submit) than /api/auth so that
# server/middlewares/content.coffee fakeSubmitException can be applied
# to the strict minimum
module.exports =
  post: (req, res, next)->
    { redirect } = req.query
    { referer } = req.headers
    route = solveRoute redirect, referer
    res.redirect route

# Possible redirection parameters by priority
# - a redirect parameter in the query string
# - the referer found in headers
# - the root
solveRoute = (redirect, referer)->
  if redirect? then "/#{redirect}"
  else referer or '/'
