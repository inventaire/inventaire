{ toArray } = require 'lodash'
{ typeOf } = require './base'

module.exports = types_ =
  assertType: (obj, type)->
    trueType = typeOf obj
    if trueType in type.split('|') then return obj
    else
      err = new Error "TypeError: expected #{type}, got #{obj} (#{trueType})"
      err.context = arguments
      throw err

  assertTypes: (args, types, minArgsLength)->

    # in case it's an 'arguments' object
    args = toArray args

    # accepts a common type for all the args as a string
    # ex: types = 'numbers...'
    # or even 'numbers...|strings...' to be translated as several 'number|string'
    # => types = ['number', 'number', ... (args.length times)]
    if typeof types is 'string' and types.split('s...').length > 1
      uniqueType = types.split('s...').join ''
      types = duplicatesArray uniqueType, args.length

    # testing arguments types once polymorphic interfaces are normalized
    types_.assertType args, 'array'
    types_.assertType types, 'array'
    types_.assertType minArgsLength, 'number'  if minArgsLength?

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
        types_.assertType args[i], types[i]
        i += 1
    catch err
      err.context = arguments
      throw err

duplicatesArray = (str, num)-> [0...num].map -> str
