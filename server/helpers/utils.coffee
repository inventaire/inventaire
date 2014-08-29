colors = require 'colors'
fs = require 'fs'

String::label = (label, color)->
  if color? then console.log "[" + label[color] + "] #{@toString()}"
  else console.log "[" + label['blue'] + "] #{@toString()}"
  return @toString()

module.exports =
  sendJSON: (res, obj, status = '200')->
    # _.logGreen obj, 'sendJSON'
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
      return obj

    else
      if label?
        console.log "****** ".grey + label[color] + " ******".grey
      else
        console.log "******************************"[color]
      console.log obj
      console.log "-----".grey
      return obj

  logRed: (obj, label)->
    obj = obj.stack if obj?.stack?
    @log obj, label, 'red'
  error: @logRed
  logGreen: (obj, label)-> @log obj, label, 'green'
  logBlue: (obj, label)-> @log obj, label, 'blue'
  logCyan: (obj, label)-> @log obj, label, 'cyan'
  logYellow: (obj, label)-> @log obj, label, 'yellow'
  logPurple: (obj, label)-> @log obj, label, 'magenta'
  logRainbow: (obj, label)-> @log obj, label, 'rainbow'

  logArray: (array, label, color='yellow')->
    spaced = new Array
    array.forEach (el)=>
      spaced.push el
      spaced.push @_
    spaced.pop()
    @log spaced, label, color

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

  mapCouchResult: (type, body)->
    return body.rows.map (el)-> el[type]

  hasDiff: (one, two)-> JSON.stringify(one) != JSON.stringify(two)

  getObjIfSuccess: (db, body)->
    if db.get? && body.ok
      return db.get(body.id)
    else if db.get?
      throw new Error "#{body.error}: #{body.reason}"
    else
      throw new Error "bad db object passed to _.getObjIfSuccess"

  hasValue: (array, value)-> array.indexOf(value) isnt -1

  randomGen: (length, withoutNumbers)->
    text = ""
    if withoutNumbers
      possible="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    else
      possible="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    i = 0
    while i < length
      text += possible.charAt(Math.floor(Math.random() * possible.length))
      i++
    return text

  extend: (one, two)->
    for k,v of two
      if one[k]? then k += _.randomGen(6, true)
      one[k] = v
    return one

  _: '-----------------------------------------------------------------'

  jsonFile: (path)->
    JSON.parse fs.readFileSync(path).toString()

  wmCommonsThumb: (file, width=100)->
    "http://commons.wikimedia.org/w/thumb.php?width=#{width}&f=#{file}"