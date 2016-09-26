CONFIG = require 'config'
__ = CONFIG.universalPath

if CONFIG.serverStaticFiles
  americano = require 'americano'
  publicPath = __.path 'client', 'public'
  staticMiddleware = americano.static publicPath, { maxAge: CONFIG.staticMaxAge }
  # the 2 arguments array will be apply'ied to app.use by americano
  exports.mountStaticFiles = [ '/public', staticMiddleware ]
else
  exports.mountStaticFiles = require './pass'
