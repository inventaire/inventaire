// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const _ = require('lodash')
const { typeOf } = require('./base')
const error_ = require('../error/error')

const assertType = (type, obj) => {
  const trueType = typeOf(obj)
  if (type.split('|').includes(trueType)) return obj
  else throw error_.new(`TypeError: expected ${type}, got ${stringify(obj)} (${trueType})`, 500, { type, obj })
}

const assertTypes = (types, args) => {
  if (_.isArguments(args)) {
    args = _.toArray(args)
    if (!_.isArray(types)) {
      // Do not accept doted syntax types as we wouldn't know how many arguments are expected
      const errMessage = "types should be an array when used with 'arguments'"
      throw error_.new(errMessage, 500, { args, types })
    }
  } else {
    types = parseTypes(types, args)
    assertType('array', args)
    assertType('array', types)
  }

  if (args.length !== types.length) {
    throw error_.new("arguments and types length don't match", 500, { args, types })
  }

  return args.map((arg, i) => assertType(types[i], arg))
}

const stringify = value => {
  if (typeof value !== 'object') return value

  const json = JSON.stringify(value)
  if (json.length > 150) return `${json.slice(0, 150)}...`
  else return json
}

// Accepts a common type for all the args as a string
// ex: types = 'numbers...'
// Or even 'numbers...|strings...' to be translated as several 'number|string'
// => types = ['number', 'number', ... (args.length times)]
const parseTypes = (types, args) => {
  if (typeof types !== 'string' || types.match('s...') == null) return types
  const multiTypes = types.split('s...').join('')
  return _.times(args.length, () => multiTypes)
}

module.exports = {
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
  objects: assertTypes.bind(null, 'objects...')
}
