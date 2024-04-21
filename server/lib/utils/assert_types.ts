import { isArguments, isArray, times } from 'lodash-es'
import { newError } from '#lib/error/error'
import { typeOf } from './types.js'

function assertType (type, obj) {
  const trueType = typeOf(obj)
  if (type.split('|').includes(trueType)) return obj
  else throw newError(`TypeError: expected ${type}, got ${stringify(obj)} (${trueType})`, 500, { type, obj })
}

function assertTypes (types, args) {
  if (isArguments(args)) {
    args = Array.from(args)
    if (!isArray(types)) {
      // Do not accept doted syntax types as we wouldn't know how many arguments are expected
      const errMessage = "types should be an array when used with 'arguments'"
      throw newError(errMessage, 500, { args, types })
    }
  } else {
    types = parseTypes(types, args)
    assertType('array', args)
    assertType('array', types)
  }

  if (args.length !== types.length) {
    throw newError("arguments and types length don't match", 500, { args, types })
  }

  return args.map((arg, i) => assertType(types[i], arg))
}

function stringify (value) {
  if (typeof value !== 'object') return value

  const json = JSON.stringify(value)
  if (json.length > 150) return `${json.slice(0, 150)}...`
  else return json
}

// Accepts a common type for all the args as a string
// ex: types = 'numbers...'
// Or even 'numbers...|strings...' to be translated as several 'number|string'
// => types = ['number', 'number', ... (args.length times)]
function parseTypes (types, args) {
  if (typeof types !== 'string' || types.match('s...') == null) return types
  const multiTypes = types.split('s...').join('')
  return times(args.length, () => multiTypes)
}

export const assert_ = {
  type: assertType,
  types: assertTypes,

  string: assertType.bind(null, 'string'),
  number: assertType.bind(null, 'number'),
  boolean: assertType.bind(null, 'boolean'),
  array: assertType.bind(null, 'array'),
  object: assertType.bind(null, 'object'),
  function: assertType.bind(null, 'function'),
  promise: assertType.bind(null, 'promise'),

  strings: assertTypes.bind(null, 'strings...'),
  numbers: assertTypes.bind(null, 'numbers...'),
  arrays: assertTypes.bind(null, 'arrays...'),
  objects: assertTypes.bind(null, 'objects...'),
}
