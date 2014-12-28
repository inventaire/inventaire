_ = require('config').root.require 'builders', 'utils'
CONFIG = require 'config'

exports.restrictApiAccess = (req, res, next) ->
  if isApiRoute req.originalUrl
    if req.session.email then next()
    else if whitelistedRoute req.originalUrl then next()
    else
      _.errorHandler res, "unauthorized api access: #{req.originalUrl}", 401
  else next()

isApiRoute = (route)-> /^\/(api|test)\//.test route

whitelistedRoute = (route)-> route in whitelistedRoutes

whitelistedRoutes = [
  '/api/auth'
  '/api/items/public'
  '/api/entities'
]
