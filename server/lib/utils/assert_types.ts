import { isArguments, isArray, times } from 'lodash-es'
import { newError } from '#lib/error/error'
import { typeOf } from './types.js'

export function assertType (type: string, obj: unknown) {
  const trueType = typeOf(obj)
  if (!type.split('|').includes(trueType)) {
    throw newError(`expected ${type}, got ${stringify(obj)} (${trueType})`, 500, { type, obj }, TypeError)
  }
}

export function assertTypes (types: string | string[], args: unknown[]) {
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

export function assertString (str: unknown): asserts str is string {
  assertType('string', str)
}

export function assertNumber (num: unknown): asserts num is number {
  assertType('number', num)
}

export function assertBoolean (bool: unknown): asserts bool is boolean {
  assertType('boolean', bool)
}

export function assertArray (arr: unknown): asserts arr is Array<unknown> {
  assertType('array', arr)
}

export function assertObject (obj: unknown): asserts obj is Record<string, unknown> {
  assertType('object', obj)
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function assertFunction (fn: unknown): asserts fn is Function {
  assertType('function', fn)
}

export function assertPromise (promise: unknown): asserts promise is Promise<unknown> {
  assertType('promise', promise)
}

export function assertStrings (strings: unknown[]): asserts strings is string[] {
  assertTypes('strings...', strings)
}

export function assertNumbers (numbers: unknown[]): asserts numbers is number[] {
  assertTypes('numbers...', numbers)
}

export function assertArrays (arrays: unknown[]): asserts arrays is Array<unknown>[] {
  assertTypes('arrays...', arrays)
}

export function assertObjects (objects: unknown[]): asserts objects is Record<string, unknown>[] {
  assertTypes('objects...', objects)
}
