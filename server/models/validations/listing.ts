import { isVisibilityKeyArray } from '#models/validations/visibility'
import commonValidations from './common.js'

const { pass, BoundedString, userId } = commonValidations

const listingsValidations = {
  pass,
  description: BoundedString(0, 5000),
  visibility: isVisibilityKeyArray,
  creator: userId,
  name: BoundedString(0, 128),
}

export default listingsValidations
