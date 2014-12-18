CONFIG = require 'config'
americano = require 'americano'
publicPath = __dirname + '/../../client/public'


staticMiddleware = ->
  options = maxAge: CONFIG.staticMaxAge
  return americano.static publicPath, options

exports.mountStaticFiles = ['/static', staticMiddleware()]


favicon = require 'serve-favicon'

exports.favicon = favicon publicPath + '/images/favicon.ico'


exports.cacheControl = (req, res, next) ->
  if CONFIG.noCache
    res.header 'Cache-Control', 'no-cache, no-store, must-revalidate'
  next()