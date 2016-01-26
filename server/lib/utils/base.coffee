colors = require 'colors'
# force the use of colors even if process.stdout.isTTY is false
# which may happen with supervisor or daemon process
# cf http://stackoverflow.com/questions/30974445/node-js-winston-logger-no-colors-with-nohup/30976363#30976363
colors.enabled = true

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
    for keys1 in array1
      for keys2 in array2
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

  okWarning: (res, warning, status=200)->
    res.status(status).json {ok: true, warning: warning}

  wrap: (res, key, data)->
    obj = {}
    obj[key] = data
    res.json obj

  Map: (fn)-> (array)-> array.map fn

  extractReqIp: (req)-> req.headers['x-forwarded-for']

  stringToInt: (str)->
    unless typeof str is 'string' then throw new Error 'expected a string'
    # testing the validity of the string is needed
    # to avoid getting NaN from parseInt
    unless /^\d+$/.test str then throw new Error 'invalid integer string'
    return parseInt str

  stringToFloat: (str)->
    unless typeof str is 'string' then throw new Error 'expected a string'
    unless /^[\d\.]+$/.test str then throw new Error 'invalid integer string'
    return parseFloat str

base.objDiff = -> not base.sameObjects.apply(null, arguments)

base.Ok = (res, status)-> base.ok.bind null, res, status
base.OkWarning = (res, warning, status)->
  base.okWarning.bind null, res, warning, status

base.Wrap = (res, key)-> base.wrap.bind null, res, key
