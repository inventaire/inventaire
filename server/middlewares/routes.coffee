CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

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
      _.errorHandler res, "unauthorized api access: #{req.originalUrl} (routes middleware restrictApiAccess)", 401
  else next()

isApiRoute = (route)-> /^\/(api|test)\//.test route

whitelistedRoute = (pathname)->
  # ex: /api/module/public?action=dostuff
  pathname.split('/')[3] is 'public'
