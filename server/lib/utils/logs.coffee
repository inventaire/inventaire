CONFIG = require 'config'
__ = CONFIG.root
errorCounter = 0

module.exports = (_)->
  loggers_ = __.require('sharedLibs', 'loggers')(_)

  log = (obj, label, color = 'cyan')->
    # allow to pass the label as first argument
    [obj, label] = loggers_.reorderObjLabel obj, label
    if typeof obj is 'string' and !label?
      console.log obj[color]
      return obj

    else
      if label?
        console.log "****** ".grey + label.toString()[color] + " ******".grey
      else
        console.log "******************************"[color]
      console.log obj
      console.log "-----".grey
      return obj

  logs_ =
    log: log
    error: (obj, label, parse=true)->
      # allow to pass the label as first argument
      [obj, label] = loggers_.reorderObjLabel obj, label
      errorCounter++
      obj = obj?.stack or obj  if parse
      log obj, label, 'red'

    errorCount: -> errorCounter

    success: (obj, label)-> log obj, label, 'green'
    info: (obj, label)-> log obj, label, 'blue'
    logCyan: (obj, label)-> log obj, label, 'cyan'
    warn: (obj, label)-> log obj, label, 'yellow'
    logPurple: (obj, label)-> log obj, label, 'magenta'
    logRainbow: (obj, label)-> log obj, label, 'rainbow'

    logArray: (array, label, color='yellow')->
      spaced = []
      array.forEach (el)=>
        spaced.push el
        spaced.push '--------'
      spaced.pop()
      log spaced, label, color

    logErrorsCount: ->
      prev = 0
      counter = ->
        errs = @errorCount()
        if errs isnt prev
          prev = errs
          console.log 'errors: '.red + errs

      setInterval counter.bind(@), 5000

  if CONFIG.verbosity is 0 then logs_.log = _.identity


  bindingLoggers =
    Log: (label)-> loggers_.bindLabel logs_.log, label
    Error: (label)-> loggers_.bindLabel logs_.error, label
    Warn: (label)-> loggers_.bindLabel logs_.warn, label
    Info: (label)-> loggers_.bindLabel logs_.info, label
    Success: (label)-> loggers_.bindLabel logs_.success, label

  return _.extend logs_, bindingLoggers
