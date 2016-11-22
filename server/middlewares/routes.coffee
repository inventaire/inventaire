CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
passport_ = __.require 'lib', 'passport/passport'

exports.restrictApiAccess = (req, res, next) ->
  if CONFIG.apiOpenBar
    # for testing purpose only
    _.warn '/!\\ API open bar: on'
    return next()

  pathname = req._parsedUrl.pathname
  unless isApiRoute pathname then return next()
  if whitelistedRoute(pathname) then return next()

  if requiresAdminRights pathname
    # Replace next so that all the methods hereafter, sync or async,
    # can verify the admin rights once the user is authentified and set on req.user
    next = VerifyAdminRights req, res, next

  # verify that the user as a valid session
  if req.isAuthenticated() then next()
  # else try one-time authentification means
  else if basicAuth(req, res, next) then return
  else
    error_.bundle req, res, 'unauthorized api access', 401, req.originalUrl

isApiRoute = (route)-> /^\/(api|test)\//.test route

# ex: /api/module/public?action=dostuff
whitelistedRoute = (pathname)-> pathname.split('/')[3] is 'public'

# ex: /api/module/admin?action=doadminstuff
requiresAdminRights = (pathname)-> pathname.split('/')[3] is 'admin'

basicAuth = (req, res, next)->
  unless req.headers.authorization? then return false
  # let the basic auth strategy handle the rest
  # TODO: handle response to avoid text/plain 401 response
  # to keep the API consistent on Content-Type
  passport_.authenticate.basic req, res, next
  return true

VerifyAdminRights = (req, res, next)-> ()->
  if req.user.admin then next()
  else error_.bundle req, res, 'unauthorized admin api access', 401, req.originalUrl
