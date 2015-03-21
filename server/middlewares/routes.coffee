CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

exports.restrictApiAccess = (req, res, next) ->
  if CONFIG.apiOpenBar
    # for testing purpose only
    _.warn '/!\\ API open bar: on'
    return next()

  pathname = req._parsedUrl.pathname
  if isApiRoute pathname
    if req.isAuthenticated() then next()
    else if whitelistedRoute(pathname) then next()
    else
      error_.bundle res, "unauthorized api access", 401, req.originalUrl
  else next()

isApiRoute = (route)-> /^\/(api|test)\//.test route

whitelistedRoute = (pathname)->
  # ex: /api/module/public?action=dostuff
  pathname.split('/')[3] is 'public'
