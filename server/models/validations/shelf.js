import { isColorHexCode } from '#lib/boolean_validations'
import { isVisibilityKeyArray } from '#models/validations/visibility'
import { pass, BoundedString, userId } from './common.js'

export default {
  pass,
  description: BoundedString(0, 5000),
  visibility: isVisibilityKeyArray,
  owner: userId,
  name: BoundedString(0, 128),
  color: isColorHexCode
}
