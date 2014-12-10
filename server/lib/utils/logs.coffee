module.exports =
  log: (obj, label, color = 'cyan')->
    if typeof obj is 'string' and !label?
      console.log obj[color]
      return obj

    else
      if label?
        console.log "****** ".grey + label[color] + " ******".grey
      else
        console.log "******************************"[color]
      console.log obj
      console.log "-----".grey
      return obj

  error: (obj, label)->
    obj = obj.stack if obj?.stack?
    @log obj, label, 'red'
  success: (obj, label)-> @log obj, label, 'green'
  info: (obj, label)-> @log obj, label, 'blue'
  logCyan: (obj, label)-> @log obj, label, 'cyan'
  warn: (obj, label)-> @log obj, label, 'yellow'
  logPurple: (obj, label)-> @log obj, label, 'magenta'
  logRainbow: (obj, label)-> @log obj, label, 'rainbow'

  logArray: (array, label, color='yellow')->
    spaced = []
    array.forEach (el)=>
      spaced.push el
      spaced.push '--------'
    spaced.pop()
    @log spaced, label, color