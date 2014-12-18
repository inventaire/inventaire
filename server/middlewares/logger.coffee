CONFIG = require 'config'
americano = require 'americano'

logger = americano.logger CONFIG.morganLogFormat
pass = (req, res, next)-> next()

if CONFIG.logStaticFilesRequests
  [loggerBeforeStatic, loggerAfterStatic] = [logger, pass]
else
  [loggerBeforeStatic, loggerAfterStatic] = [pass, logger]

module.exports =
  beforeStatic: loggerBeforeStatic
  afterStatic: loggerAfterStatic