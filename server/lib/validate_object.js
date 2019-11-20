const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')

// Throws if the passed object doesn't respect the provided constraints:
// - validKeys: a limited set of possible keys
// - valuesType: the expected type of values (optional)
module.exports = (obj, validKeys, valuesType) => {
  assert_.types([ 'object', 'array' ], [ obj, validKeys ])
  if (valuesType != null) { assert_.string(valuesType) }

  for (const key in obj) {
    const value = obj[key]
    if (!validKeys.includes(key)) {
      throw error_.new(`invalid object key: ${key}`, 500, [ key, obj ])
    }

    if (valuesType != null) {
      if (_.typeOf(value) !== valuesType) {
        throw error_.new(`invalid object value: ${value}`, 500, [ value, obj ])
      }
    }
  }
}
