CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'

# keeping track of errors hash to avoid logging errors
# everytimes a session updates
errorList = {}
flushErrors = -> errorList = {}
setInterval flushErrors, 24 * 3600 * 1000

module.exports = (err, fullReport)->
  {hash} = err
  unless errorList[hash]
    _.error err, 'client error report', false
    # not logging it as an error to avoid having the error
    # be counted twice
    _.warn fullReport, 'client full report'
    errorList[hash] = true