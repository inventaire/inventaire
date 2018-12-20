CONFIG = require 'config'
{ toArray, times } = require 'lodash'
{ typeOf } = require './base'

# Working around the circular dependency
error_ = null
lateRequire = -> error_ = require '../error/error'
setTimeout lateRequire, 0

assertType = (type, obj)->
  trueType = typeOf obj
  if trueType in type.split('|') then return obj
  else throw error_.new "TypeError: expected #{type}, got #{obj} (#{trueType})", 500, arguments

assertTypes = (types, args)->
  # Convert 'arguments' objects to real arrays
  args = toArray args
  types = parseTypes types, args

  # Testing arguments types once polymorphic interfaces are normalized
  assertType 'array', args
  assertType 'array', types

  unless args.length is types.length
    throw error_.new "arguments and types length don't match", 500, { args, types }

  return args.map (arg, i)-> assertType types[i], arg

# Accepts a common type for all the args as a string
# ex: types = 'numbers...'
# Or even 'numbers...|strings...' to be translated as several 'number|string'
# => types = ['number', 'number', ... (args.length times)]
parseTypes = (types, args)->
  unless typeof types is 'string' and types.match('s...')? then return types
  multiTypes = types.split('s...').join ''
  return times args.length, -> multiTypes

module.exports =
  type: assertType
  types: assertTypes

  string: assertType.bind null, 'string'
  number: assertType.bind null, 'number'
  boolean: assertType.bind null, 'boolean'
  array: assertType.bind null, 'array'
  object: assertType.bind null, 'object'
  function: assertType.bind null, 'function'

  strings: assertTypes.bind null, 'strings...'
  numbers: assertTypes.bind null, 'numbers...'
  arrays: assertTypes.bind null, 'arrays...'
  objects: assertTypes.bind null, 'objects...'
