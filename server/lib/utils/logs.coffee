CONFIG = require 'config'
{ offline } = CONFIG
errorCounter = 0
loggers_ = require 'inv-loggers'
util = require 'util'
chalk = require 'chalk'
{ grey, red } = chalk
openIssue = require './open_issue'

BaseLogger = (color, operation)->
  return logger = (obj, label)->
    # fully display deep objects
    console.log grey('****') + chalk[color]("#{label}") + grey('****')
    console.log operation(obj)
    console.log grey('----------')
    return obj

module.exports = (_)->
  if CONFIG.verbosity is 0 then loggers_.log = _.identity

  inspect = BaseLogger 'magenta', (obj)-> util.inspect obj, false, null
  stringify = BaseLogger 'yellow', JSON.stringify

  customLoggers =
    stringify: stringify
    inspect: inspect
    Inspect: (label)-> fn = (obj)-> inspect obj, label

    error: (err, label, logStack = true)->
      unless err instanceof Error
        throw new Error('invalid error object')

      if err._hasBeenLogged then return

      # If the error is of a lower lever than 500, make it a warning, not an error
      if err.statusCode? and err.statusCode < 500
        return customLoggers.warn err, label

      # Prevent logging big error stack traces for network errors
      # in offline development mode
      if offline and err.code is 'ENOTFOUND'
        loggers_.log err.message, "#{label} (offline)", 'red'
        return

      loggers_.log _.omit(err, 'stack'), label, 'red'
      if logStack
        # Make the stack more readable
        err.stack = err.stack.split '\n'
        # Log the stack appart to make it be displayed with line breaks
        console.log err.stack

      err.labels or= 'server'
      openIssue err

      err._hasBeenLogged = true
      errorCounter++
      return

    warn: (err, label)->
      # Errors that have a status code of 404 don't need to be logged
      # as they will be logged by the request logger middleware (morgan)
      # and logging the error object is of no help, everything is in the URL
      if err._hasBeenLogged or err.statusCode is 404 then return
      if err instanceof Error
        # shorten the stack trace
        err.stack = err.stack.split('\n').slice(0, 3).join('\n')

      loggers_.warn.apply null, arguments
      err._hasBeenLogged = true
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

    startTimer: (key)->
      console.time chalk.magenta(key)
      # Make sure to return the non-formated key
      return key

    # To be used in promise chains
    StartTimer: (key)-> (data)->
      customLoggers.startTimer key
      return data

    EndTimer: (key)-> (data)->
      console.timeEnd chalk.magenta(key)
      return data

  # The same as inv-loggers::errorRethrow but using customLoggers.error instead
  errorRethrow = (err, label)->
    customLoggers.error err, label
    throw err
  # Overriding inv-loggers partial loggers with the above customized loggers
  customLoggers.Warn = loggers_.partialLogger customLoggers.warn
  customLoggers.Error = loggers_.partialLogger customLoggers.error
  customLoggers.ErrorRethrow = loggers_.partialLogger errorRethrow

  # overriding inv-loggers 'error' and 'warn'
  return _.extend {}, loggers_, customLoggers
