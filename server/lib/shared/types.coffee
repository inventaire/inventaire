module.exports = (_)->
  type: (obj, type)->
    trueType = _.typeOf obj
    if trueType in type.split('|') then return obj
    else
      err = new Error "TypeError: expected #{type}, got #{obj} (#{trueType})"
      err.context = arguments
      throw err

  types: (args, types, minArgsLength)->

    # in case it's an 'arguments' object
    args = _.toArray(args)

    # accepts a common type for all the args as a string
    # ex: types = 'numbers...'
    # or even 'numbers...|strings...' to be translated as several 'number|string'
    # => types = ['number', 'number', ... (args.length times)]
    if typeof types is 'string' and types.split('s...').length > 1
      uniqueType = types.split('s...').join ''
      types = duplicatesArray uniqueType, args.length

    # testing arguments types once polymorphic interfaces are normalized
    _.type args, 'array'
    _.type types, 'array'
    _.type minArgsLength, 'number'  if minArgsLength?

    if minArgsLength?
      test = types.length >= args.length >= minArgsLength
    else test = args.length is types.length

    unless test
      if minArgsLength?
        err = "expected between #{minArgsLength} and #{types.length} arguments ," +
          "got #{args.length}: #{args}"
      else
        err = "expected #{types.length} arguments, got #{args.length}: #{args}"
      console.log args
      err = new Error err
      err.context = arguments
      throw err

    i = 0
    try
      while i < args.length
        _.type args[i], types[i]
        i += 1
    catch err
      err.context = arguments
      throw err

  typeOf: (obj)->
    # just handling what differes from typeof
    type = typeof obj
    if type is 'object'
      if _.isNull(obj) then return 'null'
      if _.isArray(obj) then return 'array'
    if type is 'number'
      if _.isNaN(obj) then return 'NaN'
    return type

  # soft testing: doesn't throw
  areStrings: (array)-> _.all array, _.isString

  typeString: (str)-> _.type str, 'string'
  typeArray: (array)-> _.type array, 'array'

  # helpers to simplify polymorphisms
  forceArray: (keys)->
    if not keys? or keys is '' then return []
    unless _.isArray(keys) then [ keys ]
    else keys

  forceObject: (key, value)->
    unless _.isObject key
      obj = {}
      obj[key] = value
      return obj
    else key

duplicatesArray = (str, num)-> [0...num].map -> str
