CONFIG = require 'config'
americano = require 'americano'
pass = require './pass'

{ logFormat, mutedRoutes } = CONFIG.morgan

logger = americano.logger
  format: logFormat
  skip: (req, res)->
    route = req.originalUrl
    return route in mutedRoutes

# Init the logger before the static files middleware to log static files requests
# Has no effect when CONFIG.serveStaticFiles is false notably in production,
# where static files are served by the Nginx server
if CONFIG.logStaticFilesRequests
  [ before, after ] = [ logger, pass ]
else
  [ before, after ] = [ pass, logger ]

module.exports =
  beforeStatic: before
  afterStatic: after
