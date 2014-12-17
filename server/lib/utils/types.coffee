module.exports =
  type: (obj, type)->
    trueType = @typeOf obj
    if type is trueType then return obj
    else throw new Error "TypeError: expected #{type}, got #{trueType}"

  types: (args, types...)->
    args = @toArray(args)
    if args.length isnt types.length
      throw new Error "expected #{types.length} arguments, got #{args.length}"
    i = 0
    while i < args.length
      @type args[i], types[i]
      i += 1

  typeOf: (obj)->
    # just handling what differes from typeof
    type = typeof obj
    if type is 'object'
      if @isNull(obj) then return 'null'
      if @isArray(obj) then return 'array'
    return type

  # soft testing: doesn't throw
  areStrings: (array)-> @all array, @isString
