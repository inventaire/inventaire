colors = require 'colors'

module.exports =
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