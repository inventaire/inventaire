import { isArguments, isArray, times } from 'lodash-es'
import { newError } from '#lib/error/error'
import { typeOf } from './types.js'

function assertType (type: string, obj: unknown) {
  const trueType = typeOf(obj)
  if (!type.split('|').includes(trueType)) {
    throw newError(`expected ${type}, got ${stringify(obj)} (${trueType})`, 500, { type, obj }, TypeError)
  }
}

function assertTypes (types: string | string[], args: unknown[]) {
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

  args.forEach((arg, i) => assertType(types[i], arg))
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

// Avoid triggering TS2775 in consuùùers by using an explicit type annotation
// See https://stackoverflow.com/a/72689922/3324977
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const assert_: Record<string, Function> = {
  type: assertType,
  types: assertTypes,

  string (str: unknown): asserts str is string {
    assertType('string', str)
  },
  number (num: unknown): asserts num is number {
    assertType('number', num)
  },
  boolean (bool: unknown): asserts bool is boolean {
    assertType('boolean', bool)
  },
  array (arr: unknown): asserts arr is Array<unknown> {
    assertType('array', arr)
  },
  object (obj: unknown): asserts obj is Record<string, unknown> {
    assertType('object', obj)
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  function (fn: unknown): asserts fn is Function {
    assertType('function', fn)
  },
  promise (promise: unknown): asserts promise is Promise<unknown> {
    assertType('promise', promise)
  },

  strings (strings: unknown[]): asserts strings is string[] {
    assertTypes('strings...', strings)
  },
  numbers (numbers: unknown[]): asserts numbers is number[] {
    assertTypes('numbers...', numbers)
  },
  arrays (arrays: unknown[]): asserts arrays is Array<unknown>[] {
    assertTypes('arrays...', arrays)
  },
  objects (objects: unknown[]): asserts objects is Record<string, unknown>[] {
    assertTypes('objects...', objects)
  },
}
