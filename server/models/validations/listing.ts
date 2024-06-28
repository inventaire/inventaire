import { isVisibilityKeyArray } from '#models/validations/visibility'
import attributes from '../attributes/listing.js'
import commonValidations from './common.js'

const { pass, BoundedString, userId } = commonValidations

const listingsValidations = {
  pass,
  description: BoundedString(0, 5000),
  visibility: isVisibilityKeyArray,
  creator: userId,
  name: BoundedString(0, 128),
  type: type => attributes.type.includes(type),
}

export default listingsValidations
