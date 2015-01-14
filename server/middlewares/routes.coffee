_ = require('config').root.require 'builders', 'utils'
CONFIG = require 'config'

exports.restrictApiAccess = (req, res, next) ->
  if CONFIG.apiOpenBar then return next()

  pathname = req._parsedUrl.pathname
  if isApiRoute pathname
    if req.session.email then next()
    else if whitelistedRoute(pathname) then next()
    else
      _.errorHandler res, "unauthorized api access: #{req.originalUrl}", 401
  else next()

isApiRoute = (route)-> /^\/(api|test)\//.test route

whitelistedRoute = (pathname)->
  # ex: /api/module/public?action=dostuff
  pathname.split('/')[3] is 'public'
