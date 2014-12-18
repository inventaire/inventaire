CONFIG = require 'config'
americano = require 'americano'

logger = americano.logger CONFIG.morganLogFormat
pass = (req, res, next)-> next()

if CONFIG.logStaticFilesRequests
  [before, after] = [logger, pass]
else
  [before, after] = [pass, logger]

module.exports =
  beforeStatic: before
  afterStatic: after