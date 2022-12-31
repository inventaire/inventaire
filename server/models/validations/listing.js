import { isVisibilityKeyArray } from 'models/validations/visibility'
import { pass, BoundedString, userId } from './common'

export default {
  pass,
  description: BoundedString(0, 5000),
  visibility: isVisibilityKeyArray,
  creator: userId,
  name: BoundedString(0, 128),
}
