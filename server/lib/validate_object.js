const _ = require('builders/utils')
const error_ = require('lib/error/error')
const assert_ = require('lib/utils/assert_types')

// Throws if the passed object doesn't respect the provided constraints:
// - validKeys: a limited set of possible keys
// - valuesType: the expected type of values (optional)
module.exports = (obj, validKeys, valuesType) => {
  assert_.object(obj)
  assert_.array(validKeys)
  if (valuesType) assert_.string(valuesType)

  for (const key in obj) {
    const value = obj[key]
    if (!validKeys.includes(key)) {
      throw error_.new(`invalid object key: ${key}`, 500, [ key, obj ])
    }

    if (valuesType) {
      if (_.typeOf(value) !== valuesType) {
        throw error_.new(`invalid object value: ${value}`, 500, [ value, obj ])
      }
    }
  }
}
