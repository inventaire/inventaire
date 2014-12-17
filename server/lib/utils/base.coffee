colors = require 'colors'
fs = require 'fs'

String::logIt = (label, color)->
  if color? then console.log "[" + label[color] + "] #{@toString()}"
  else console.log "[" + label['blue'] + "] #{@toString()}"
  return @toString()

module.exports =
  errorHandler: (res, err, status = 500)->
    if /^4/.test status then @warn err
    else @error new Error(err), err
    res.setHeader 'Content-Type', 'text/html'
    res.status status or 500
    # dont send the error details to the user
    res.end()

  mapCouchResult: (type, body)-> body.rows.map (el)-> el[type]
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

  areStringsOrFalsy: (array)->
    compacted = @compact(array)
    if compacted.length > 0 and @areStrings(compacted)
      return true
    else return false

  combinations: (array1, array2)->
    @types arguments, 'array', 'array'
    results = []
    array1.forEach (keys1)->
      array2.forEach (keys2)->
        results.push [keys1, keys2]
    return results

  timer: (fn, sync)->
    id = @now()
    console.time id
    if sync
      cb()
      console.timeEnd id
    else
      cb().then -> console.timeEnd id
