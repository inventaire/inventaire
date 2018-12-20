{ toArray, times } = require 'lodash'
{ typeOf } = require './base'

# Working around the circular dependency
error_ = null
lateRequire = -> error_ = require '../error/error'
setTimeout lateRequire, 0

assertType = (obj, type)->
  trueType = typeOf obj
  if trueType in type.split('|') then return obj
  else throw error_.new "TypeError: expected #{type}, got #{obj} (#{trueType})", 500, arguments

assertTypes = (args, types)->
  # Convert 'arguments' objects to real arrays
  args = toArray args
  types = parseTypes types, args

  # Testing arguments types once polymorphic interfaces are normalized
  assertType args, 'array'
  assertType types, 'array'

  unless args.length is types.length
    throw error_.new "arguments and types length don't match", 500, { args, types }

  args.forEach (arg, i)-> assertType arg, types[i]

# Accepts a common type for all the args as a string
# ex: types = 'numbers...'
# Or even 'numbers...|strings...' to be translated as several 'number|string'
# => types = ['number', 'number', ... (args.length times)]
parseTypes = (types, args)->
  unless typeof types is 'string' and types.match('s...')? then return types
  multiTypes = types.split('s...').join ''
  return times args.length, -> multiTypes

module.exports = { assertType, assertTypes }
