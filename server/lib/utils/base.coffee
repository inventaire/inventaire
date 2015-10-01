colors = require 'colors'

String::logIt = (label, color)->
  if color? then console.log "[" + label[color] + "] #{@toString()}"
  else console.log "[" + label['blue'] + "] #{@toString()}"
  return @toString()

module.exports = base =
  areStringsOrFalsy: (array)->
    compacted = @compact(array)
    if compacted.length > 0 and @areStrings(compacted)
      return true
    else return false

  combinations: (array1, array2)->
    @types arguments, ['array', 'array']
    results = []
    array1.forEach (keys1)->
      array2.forEach (keys2)->
        results.push [keys1, keys2]
    return results

  timer: (fn, sync)->
    id = Date.now()
    console.time id
    if sync
      cb()
      console.timeEnd id
    else
      cb().then -> console.timeEnd id

  pass: (req, res, next)-> next()

  sumValues: (obj)->
    if @objLength(obj) > 0
      @values(obj)?.reduce (a,b)-> a+b
    else 0

  sameObjects: (a, b)-> JSON.stringify(a) is JSON.stringify(b)

  toLowerCase: (str)-> str.toLowerCase()

  # returns a function triggering a standard confirmation response
  ok: (res, status=200)->
    res.status(status).json {ok: true}

  Map: (fn)-> (array)-> array.map fn

base.Ok = (res, status)-> base.ok.bind(null, res, status)
