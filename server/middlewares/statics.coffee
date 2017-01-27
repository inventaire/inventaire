CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

if CONFIG.serveStaticFiles
  americano = require 'americano'
  publicPath = __.path 'client', 'public'
  staticMiddleware = americano.static publicPath, { maxAge: CONFIG.staticMaxAge }
  # the 2 arguments array will be apply'ied to app.use by americano
  exports.mountStaticFiles = [ '/public', staticMiddleware ]
else
  exports.mountStaticFiles = require './pass'

exports.enableCors = (req, res, next)->
  if req.originalUrl.startsWith '/public'
    res.setHeader 'Access-Control-Allow-Origin', '*'
    res.setHeader 'Access-Control-Allow-Method', 'GET'

  next()
