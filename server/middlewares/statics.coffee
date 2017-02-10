CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
pass = require './pass'

if CONFIG.serveStaticFiles
  americano = require 'americano'
  publicPath = __.path 'client', 'public'
  staticMiddleware = americano.static publicPath, { maxAge: CONFIG.staticMaxAge }
  # the 2 arguments array will be apply'ied to app.use by americano
  exports.mountStaticFiles = [ '/public', staticMiddleware ]

  faviconPath = __.path 'client', 'public/favicon.ico'
  exports.favicon = require('serve-favicon')(faviconPath)

else
  exports.mountStaticFiles = pass
  exports.favicon = pass

exports.enableCors = (req, res, next)->
  if req.originalUrl.startsWith '/public'
    res.setHeader 'Access-Control-Allow-Origin', '*'
    res.setHeader 'Access-Control-Allow-Method', 'GET'

  next()
