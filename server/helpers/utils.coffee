colors = require 'colors'

module.exports =
  sendJSON: (res, obj, status = '200')->
    _.logGreen obj, 'sendJSON'
    res.status status
    res.setHeader 'Content-Type', 'application/json'
    res.send JSON.stringify(obj)

  errorHandler: (res, err, status = 500)->
    _.logRed err
    res.setHeader 'Content-Type', 'text/html'
    res.status status
    res.send err

  log: (obj, label, color = 'white')->
    if typeof obj is 'string' && !label?
      console.log obj[color]

    else
      if label?
        console.log "****** ".grey + label[color] + " ******".grey
      else
        console.log "******************************"[color]
      console.log obj
      console.log "-----".grey

  error: (obj, label)-> @log obj, 'ERROR: ', 'red'
  logRed: (obj, label)-> @log obj, label, 'red'
  logGreen: (obj, label)-> @log obj, label, 'green'
  logBlue: (obj, label)-> @log obj, label, 'blue'
  logCyan: (obj, label)-> @log obj, label, 'cyan'
  logYellow: (obj, label)-> @log obj, label, 'yellow'
  logPurple: (obj, label)-> @log obj, label, 'magenta'
  logRainbow: (obj, label)-> @log obj, label, 'rainbow'

    # bold # italic # underline
    # inverse # yellow # cyan
    # white # magenta # green
    # red # grey # blue
    # rainbow # zebra # random


  cleanUserData: (value)->
    if value.username? && value.email? && value.created? && value.picture?
      user =
        username: value.username
        email: value.email
        created: value.created
        picture: value.picture
      return user
    else
      throw new Error('missing user data')

  safeUserData: (value)->
    return user =
      _id: value._id
      username: value.username
      created: value.created
      picture: value.picture
      contacts: value.contacts

  map: (type, body)->
    return body.rows.map (el)-> el[type]

  hasDiff: (one, two)-> JSON.stringify(one) != JSON.stringify(two)

  getObjIfSuccess: (db, body)->
    if db.get? && body.ok
      return db.get(body.id)
    else if db.get?
      throw new Error "#{body.error}: #{body.reason}"
    else
      throw new Error "bad db object passed to _.getObjIfSuccess"
