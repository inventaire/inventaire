CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ oneDay } =  __.require 'lib', 'times'

# keeping track of errors hash to avoid logging errors
# everytimes a session updates
errorList = {}
flushErrors = -> errorList = {}
setInterval flushErrors, oneDay

module.exports = (err, fullReport)->
  {hash} = err
  unless errorList[hash]
    _.error err, 'client error report', false
    # not logging it as an error to avoid having the error
    # be counted twice
    _.warn fullReport, 'client full report'
    errorList[hash] = true