colors = require 'colors'

module.exports =
  sendJSON: (res, obj, status = '200')->
    res.status status
    res.setHeader 'Content-Type', 'application/json'
    res.send JSON.stringify(obj)


  log: (obj, label, color = 'white')->
    if label?
      console.log "****** ".grey + label[color] + " ******".grey
    else
      console.log "******************************"[color]
    console.log obj
    console.log "-----".grey
  logRed: (obj, label)-> @log obj, label, 'red'
  logGreen: (obj, label)-> @log obj, label, 'green'
  logBlue: (obj, label)-> @log obj, label, 'blue'

