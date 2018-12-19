{ toArray } = require 'lodash'
{ typeOf } = require './base'

assertType = (obj, type)->
  trueType = typeOf obj
  if trueType in type.split('|') then return obj
  else
    err = new Error "TypeError: expected #{type}, got #{obj} (#{trueType})"
    err.context = arguments
    throw err

assertTypes = (args, types)->
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
  assertType args, 'array'
  assertType types, 'array'

  unless args.length is types.length
    err = new Error "arguments and types length don't match"
    err.context = { args, types }
    throw err

  args.forEach (arg, i)->
    try
      assertType arg, types[i]
    catch err
      err.context = args
      throw err

duplicatesArray = (str, num)-> [0...num].map -> str

module.exports = { assertType, assertTypes }
