CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
americano = require 'americano'


logger = americano.logger CONFIG.morganLogFormat
pass = (req, res, next)-> next()

if CONFIG.logStaticFilesRequests
  [before, after] = [logger, pass]
else
  [before, after] = [pass, logger]



if CONFIG.sendServerErrorsClientSide
  sendServerErrorsClientSide = (req, res, next)->
    _.errorHandler = errorSentClientSide
    next()

  originalFn = _.errorHandler.bind(_)
  errorSentClientSide = (args...)->
    args[3] = true
    originalFn.apply null, args

else sendServerErrorsClientSide = pass



module.exports =
  beforeStatic: before
  afterStatic: after
  sendServerErrorsClientSide: sendServerErrorsClientSide
