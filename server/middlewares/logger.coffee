CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
americano = require 'americano'


logger = americano.logger CONFIG.morganLogFormat

if CONFIG.logStaticFilesRequests
  [before, after] = [logger, _.pass]
else
  [before, after] = [_.pass, logger]



if CONFIG.sendServerErrorsClientSide
  sendServerErrorsClientSide = (req, res, next)->
    _.errorHandler = errorSentClientSide
    next()

  originalFn = _.errorHandler.bind(_)
  errorSentClientSide = (args...)->
    args[3] = true
    originalFn.apply null, args

else sendServerErrorsClientSide = _.pass



module.exports =
  beforeStatic: before
  afterStatic: after
  sendServerErrorsClientSide: sendServerErrorsClientSide
