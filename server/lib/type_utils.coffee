module.exports =
  type: (obj, type)->
    switch type
      when 'string'
        if @isString(obj) then return else err = true
      when 'number'
        if @isNumber(obj) then return else err = true
      when 'array'
        if @isArray(obj) then return else err = true
      when 'object'
        if @isObject(obj) and not @isArray(obj) then return else err = true
    if err then throw new Error "TypeError: expected #{type}, got " + @typeOf(obj)
    throw new Error "bad argument type: #{type}"

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