module.exports = (_)->
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

  matchesCount: (arrays...)-> _.intersection.apply(_, arrays).length
  haveAMatch: (arrayA, arrayB)->
    unless _.isArray(arrayA) and _.isArray(arrayB) then return false
    for valueA in arrayA
      for valueB in arrayB
        # Return true as soon as possible
        if valueA is valueB then return true
    return false

  objLength: (obj)-> Object.keys(obj)?.length

  expired: (timestamp, ttl)-> Date.now() - timestamp > ttl

  isNonNull: (obj)-> obj?
  isNonEmptyString: (str)-> _.isString(str) and str.length > 0
  isNonEmptyArray: (array)-> _.isArray(array) and array.length > 0
  isNonEmptyPlainObject: (obj)->
    _.isPlainObject(obj) and Object.keys(obj).length > 0

  shortLang: (lang)-> lang?[0..1]

  # encodeURIComponent ignores !, ', (, ), and *
  # cf https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#Description
  fixedEncodeURIComponent: (str)->
    encodeURIComponent(str).replace /[!'()*]/g, encodeCharacter

  pickOne: (obj)->
    key = Object.keys(obj)[0]
    if key? then return obj[key]

  isDataUrl: (str)-> /^data:image/.test str

  bestImageWidth: (width)->
    # under 500, it's useful to keep the freedom to get exactly 64 or 128px etc
    # while still grouping on the initially requested width
    if width < 500 then return width

    # if in a browser, use the screen width as a max value
    if screen?.width then width = Math.min width, screen.width
    # group image width above 500 by levels of 100px to limit generated versions
    return Math.ceil(width / 100) * 100

  parseBooleanString: (booleanString, defaultVal = false)->
    if defaultVal is false
      booleanString is 'true'
    else
      booleanString isnt 'false'

  simpleDay: (date)->
    if date? then new Date(date).toISOString().split('T')[0]
    else new Date().toISOString().split('T')[0]

  isPositiveIntegerString: (str)-> _.isString(str) and /^\d+$/.test str

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
