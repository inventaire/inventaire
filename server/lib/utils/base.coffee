_ = require 'lodash'

module.exports = base =
  combinations: (array1, array2)->
    results = []
    array1.forEach (keys1)->
      array2.forEach (keys2)->
        results.push [ keys1, keys2 ]
    return results

  sumValues: (obj)->
    if base.objLength(obj) > 0
      _.values(obj)?.reduce (a, b)-> a + b
    else 0

  sameObjects: (a, b)-> JSON.stringify(a) is JSON.stringify(b)

  toLowerCase: (str)-> str.toLowerCase()

  stringToInt: (str)->
    unless typeof str is 'string' then throw new Error "expected a string: #{str}"
    # testing the validity of the string is needed
    # to avoid getting NaN from parseInt
    unless /^-?\d+$/.test str then throw new Error "invalid integer string: #{str}"
    return parseInt str

  parsePositiveInteger: (str)->
    # /!\ Difference with parseInt: not throwing
    unless typeof str is 'string' and /^\d+$/.test(str) then return
    return parseInt str

  stringToFloat: (str)->
    unless typeof str is 'string' then throw new Error "expected a string: #{str}"
    unless /^[-?\d\.]+$/.test str then throw new Error "invalid integer string: #{str}"
    return parseFloat str

  isArrayLike: (obj)-> _.isArray(obj) or _.isArguments(obj)

  # Remove any superfluous spaces
  superTrim: (str)->
    str
    .replace /^\s+/, ' '
    .replace /\s+$/, ' '
    .replace /\s+/g, ' '
    .trim()

  flattenIndexes: (indexesArray)->
    indexesArray.unshift {}
    return _.extend.apply _, indexesArray

  KeyBy: (attribute)-> (array)-> _.keyBy array, attribute

  initCollectionsIndex: (names)-> names.reduce aggregateCollections, {}

  indexAppliedValue: (array, fn)->
    return array.reduce aggragateFnApplication(fn), {}

  obfuscate: (str)-> str.replace /.{1}/g, '*'

  # adapted from http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  hashCode: (string)->
    [ hash, i, len ] = [ 0, 0, string.length ]
    if len is 0 then return hash

    while i < len
      chr = string.charCodeAt(i)
      hash = ((hash << 5) - hash) + chr
      hash |= 0 # Convert to 32bit integer
      i++
    Math.abs hash

  buildPath: (pathname, queryObj, escape)->
    queryObj = removeUndefined queryObj
    if not queryObj? or _.isEmpty(queryObj) then return pathname

    queryString = ''

    for key, value of queryObj
      if escape
        value = dropSpecialCharacters value
      if _.isObject value
        value = escapeQueryStringValue JSON.stringify(value)
      queryString += "&#{key}=#{value}"

    return pathname + '?' + queryString[1..-1]

  haveAMatch: (arrayA, arrayB)->
    unless _.isArray(arrayA) and _.isArray(arrayB) then return false
    for valueA in arrayA
      for valueB in arrayB
        # Return true as soon as possible
        if valueA is valueB then return true
    return false

  objLength: (obj)-> Object.keys(obj)?.length

  expired: (timestamp, ttl)-> Date.now() - timestamp > ttl

  shortLang: (lang)-> lang?[0..1]

  # encodeURIComponent ignores !, ', (, ), and *
  # cf https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#Description
  fixedEncodeURIComponent: (str)->
    encodeURIComponent(str).replace /[!'()*]/g, encodeCharacter

  pickOne: (obj)->
    key = Object.keys(obj)[0]
    if key? then return obj[key]

  parseBooleanString: (booleanString, defaultVal = false)->
    if defaultVal is false
      booleanString is 'true'
    else
      booleanString isnt 'false'

  simpleDay: (date)->
    if date? then new Date(date).toISOString().split('T')[0]
    else new Date().toISOString().split('T')[0]

  typeOf: (obj)->
    # just handling what differes from typeof
    type = typeof obj
    if type is 'object'
      if _.isNull(obj) then return 'null'
      if _.isArray(obj) then return 'array'
    if type is 'number'
      if _.isNaN(obj) then return 'NaN'
    return type

  # helpers to simplify polymorphisms
  forceArray: (keys)->
    if (not keys?) or (keys is '') then return []
    if _.isArray(keys) then keys
    else [ keys ]

  # Iterates on an object, with the passed function: fn(key, value)
  # Expected returned value: [ newKey, newValue ]
  mapKeysValues: (obj, fn)->
    Object.keys(obj).reduce aggregateMappedKeysValues(obj, fn), {}

aggregateMappedKeysValues = (obj, fn)-> (newObj, key)->
  value = obj[key]
  newKeyValue = fn key, value

  unless _.isArray newKeyValue
    errMessage = "function should return a [ key, value ] array (got #{newKeyValue})"
    throw new Error errMessage

  [ newKey, newValue ] = newKeyValue

  unless newKey? then throw new Error("missing new key (old key: #{key})")
  unless newValue? then throw new Error("missing new value (old value: #{value})")

  newObj[newKey] = newValue
  return newObj

encodeCharacter = (c)-> '%' + c.charCodeAt(0).toString(16)

removeUndefined = (obj)->
  newObj = {}
  for key, value of obj
    if value? then newObj[key] = value
  return newObj

dropSpecialCharacters = (str)->
  str
  .replace /\s+/g, ' '
  .replace /(\?|\:)/g, ''

# Only escape values that are problematic in a query string:
# for the moment, only '?'
escapeQueryStringValue = (str)-> str.replace /\?/g, '%3F'

aggregateCollections = (index, name)->
  index[name] = []
  return index

aggragateFnApplication = (fn)-> (index, value)->
  index[value] = fn value
  return index
