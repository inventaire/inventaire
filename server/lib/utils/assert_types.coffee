{ toArray } = require 'lodash'
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
    throw error_.new "arguments and types length don't match", 500, { args, types }

  args.forEach (arg, i)-> assertType arg, types[i]

duplicatesArray = (str, num)-> [0...num].map -> str

module.exports = { assertType, assertTypes }
