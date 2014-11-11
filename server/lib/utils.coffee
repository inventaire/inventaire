colors = require 'colors'
fs = require 'fs'

String::logIt = (label, color)->
  if color? then console.log "[" + label[color] + "] #{@toString()}"
  else console.log "[" + label['blue'] + "] #{@toString()}"
  return @toString()

module.exports =
  errorHandler: (res, err, status = 500)->
    switch status
      when 404 then @warn err
      else @error err
    res.setHeader 'Content-Type', 'text/html'
    res.status status || 500
    res.send err

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
    spaced = new Array
    array.forEach (el)=>
      spaced.push el
      spaced.push '--------'
    spaced.pop()
    @log spaced, label, color

  mapCouchResult: (type, body)-> body.rows.map (el)-> el[type]
  mapCouchValue: (body)-> @mapCouchResult 'value', body
  mapCouchDoc: (body)-> @mapCouchResult 'doc', body

  getObjIfSuccess: (db, body)->
    if db.get? and body.ok
      return db.get(body.id)
    else if db.get?
      throw new Error "#{body.error}: #{body.reason}"
    else
      throw new Error "bad db object passed to _.getObjIfSuccess"

  jsonFile: (path)->
    JSON.parse fs.readFileSync(path).toString()

  areStrings: (array)->
    result = true
    array.forEach (obj)=>
      unless @isString(obj) then result = false
    return result

  areStringsOrFalsy: (array)->
    compacted = @compact(array)
    if compacted.length > 0 and @areStrings(compacted)
      return true
    else return false