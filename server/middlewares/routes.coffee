CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
passport_ = __.require 'lib', 'passport/passport'

exports.restrictApiAccess = (req, res, next) ->
  # turn apiOpenBar for testing or maintainance purpose
  if CONFIG.apiOpenBar
    req.user = CONFIG.apiOpenBar.user
    _.warn CONFIG.apiOpenBar, '/!\\ API open bar: on'
    return next()

  pathname = req._parsedUrl.pathname
  unless isApiRoute pathname then return next()
  if whitelistedRoute pathname
    req.isPublicRoute = true
    return next()
  else
    req.isPublicRoute = false

  if requiresAdminRights pathname
    # Replace next so that all the methods hereafter, sync or async,
    # can verify the admin rights once the user is authentified and set on req.user
    next = VerifyAdminRights req, res, next

  if req.isAuthenticated() then next()
  else error_.bundle req, res, 'unauthorized api access', 401, req.originalUrl

isApiRoute = (route)-> /^\/(api|test)\//.test route

# ex: /api/module/public?action=dostuff
whitelistedRoute = (pathname)-> pathname.split('/')[3] is 'public'

# ex: /api/module/admin?action=doadminstuff
requiresAdminRights = (pathname)-> pathname.split('/')[3] is 'admin'

VerifyAdminRights = (req, res, next)-> ()->
  if req.user.admin then next()
  else error_.bundle req, res, 'unauthorized admin api access', 401, req.originalUrl
