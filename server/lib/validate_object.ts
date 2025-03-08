import { newError } from '#lib/error/error'
import { assertArray, assertObject, assertString } from '#lib/utils/assert_types'
import { typeOf } from '#lib/utils/types'

// Throws if the passed object doesn't respect the provided constraints:
// - validKeys: a limited set of possible keys
// - valuesType: the expected type of values (optional)
export default (obj: object, validKeys: string[], valuesType?: string) => {
  assertObject(obj)
  assertArray(validKeys)
  if (valuesType) assertString(valuesType)

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
