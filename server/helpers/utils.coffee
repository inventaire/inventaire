colors = require 'colors'

module.exports =
  sendJSON: (res, obj, status = '200')->
    res.status status
    res.setHeader 'Content-Type', 'application/json'
    res.send JSON.stringify(obj)

  errorHandler: (err, status = 500)->
    @logRed err
    res.setHeader 'Content-Type', 'text/html'
    res.status status
    res.send err

  log: (obj, label, color = 'white')->
    if label?
      console.log "****** ".grey + label[color] + " ******".grey
    else
      console.log "******************************"[color]
    console.log obj
    console.log "-----".grey

  logError: (obj, label)-> @log obj, 'ERROR: ', 'red'
  logRed: (obj, label)-> @log obj, label, 'red'
  logGreen: (obj, label)-> @log obj, label, 'green'
  logBlue: (obj, label)-> @log obj, label, 'blue'
  logYellow: (obj, label)-> @log obj, label, 'yellow'