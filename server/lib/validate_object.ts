import { newError } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { typeOf } from '#lib/utils/types'

// Throws if the passed object doesn't respect the provided constraints:
// - validKeys: a limited set of possible keys
// - valuesType: the expected type of values (optional)
export default (obj, validKeys, valuesType) => {
  assert_.object(obj)
  assert_.array(validKeys)
  if (valuesType) assert_.string(valuesType)

  for (const key in obj) {
    const value = obj[key]
    if (!validKeys.includes(key)) {
      throw newError(`invalid object key: ${key}`, 500, { obj, key, validKeys })
    }

    if (valuesType) {
      if (typeOf(value) !== valuesType) {
        throw newError(`invalid object value: ${value}`, 500, { obj, value, valuesType })
      }
    }
  }
}
