CONFIG = require 'config'
_ = require 'lodash'
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
  if _.isArguments args
    args = _.toArray args
    unless _.isArray types
      # Do not accept doted syntax types as we wouldn't know how many arguments are expected
      errMessage = "types should be an array when used with 'arguments'"
      throw error_.new errMessage, 500, { args, types }
  else
    types = parseTypes types, args
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
  return _.times args.length, -> multiTypes

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
