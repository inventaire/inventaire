import { isColorHexCode } from '#lib/boolean_validations'
import { isVisibilityKeyArray } from '#models/validations/visibility'
import commonValidations from './common.js'

const { pass, BoundedString, userId } = commonValidations

export default {
  pass,
  description: BoundedString(0, 5000),
  visibility: isVisibilityKeyArray,
  owner: userId,
  name: BoundedString(0, 128),
  color: isColorHexCode,
}
