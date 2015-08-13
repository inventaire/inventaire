CONFIG = require 'config'
errorCounter = 0
loggers_ = require 'inv-loggers'

module.exports = (_)->
  if CONFIG.verbosity is 0 then loggers_.log = _.identity

  customLoggers =
    error: (obj, label, parse=true)->
      errorCounter++
      obj = obj?.stack or obj  if parse
      loggers_.log obj, label, 'red'

    errorCount: -> errorCounter
    logErrorsCount: ->
      prev = 0
      counter = ->
        errs = @errorCount()
        if errs isnt prev
          prev = errs
          console.log 'errors: '.red + errs

      setInterval counter.bind(@), 5000

  # overriding inv-loggers 'error'
  return _.extend loggers_, customLoggers
