CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
americano = require 'americano'

{logFormat, mutedRoutes} = CONFIG.morgan

logger = americano.logger
  format: logFormat
  skip: (req, res)->
    route = req.originalUrl
    return route in mutedRoutes

# has no effect in prod where static files are served
# by an nginx server
if CONFIG.logStaticFilesRequests
  [before, after] = [logger, _.pass]
else
  [before, after] = [_.pass, logger]


module.exports =
  beforeStatic: before
  afterStatic: after
