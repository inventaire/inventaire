CONFIG = require 'config'
{ offline } = CONFIG
errorCounter = 0
loggers_ = require 'inv-loggers'
util = require 'util'
chalk = require 'chalk'
{ grey, red } = chalk

BaseLogger = (color, operation)->
  return logger = (obj, label)->
    # fully display deep objects
    console.log grey('****') + chalk[color]("#{label}") + grey('****')
    console.log operation(obj)
    console.log grey("----------")
    return obj

module.exports = (_)->
  if CONFIG.verbosity is 0 then loggers_.log = _.identity

  inspect = BaseLogger 'magenta', (obj)-> util.inspect obj, false, null
  stringify = BaseLogger 'yellow', JSON.stringify

  customLoggers =
    stringify: stringify
    inspect: inspect
    Inspect: (label)-> fn = (obj)-> inspect obj, label

    error: (err, label, logStack=true)->
      # Prevent logging big error stack traces for network errors
      # in offline development mode
      if offline and err.code is 'ENOTFOUND'
        loggers_.log err.message, "#{label} (offline)", 'red'
        return

      errorCounter++
      loggers_.log err, label, 'red'
      if logStack and err.stack? then console.log err.stack

      return

    errorCount: -> errorCounter

    # logs the errors total if there was an error
    # in the last 5 seconds
    # -> just a convenience for debugging
    logErrorsCount: ->
      prev = 0
      counter = ->
        errs = @errorCount()
        if errs isnt prev
          prev = errs
          console.log red('errors: ') + errs

      setInterval counter.bind(@), 5000

  # overriding inv-loggers 'error'
  return _.extend loggers_, customLoggers
