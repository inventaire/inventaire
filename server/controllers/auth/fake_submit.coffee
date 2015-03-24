CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

# allows authentification forms to submit a form already
# validated by XHR calls, in order to be catched by browsers
# password manager or other field suggestions tools
module.exports = (req, res, next)->
  route = solveRoute req.headers.referer
  res.redirect route


# by default, POSTing on this route redirects to the referer url
# but some routes needRedirectHome
solveRoute = (referer)->
  route = referer or '/'
  needRedirectHome.forEach (r)->
    re = new RegExp '/login/reset-password', 'i'
    if re.test(referer) then route = '/'

  return route


needRedirectHome = [
  '/login/reset-password'
]
