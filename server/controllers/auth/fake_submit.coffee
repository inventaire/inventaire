CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

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

  return _.log route, 'redirect route'


needRedirectHome = [
  '/login/reset-password'
]
