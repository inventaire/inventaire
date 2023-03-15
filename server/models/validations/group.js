import _ from '#builders/utils'
import slugify from '#controllers/groups/lib/slugify'
import { isGroupImg } from '#lib/boolean_validations'
import commonValidations from './common.js'

const { pass, boundedString, BoundedString, boolean, position, userId } = commonValidations

export default {
  pass,

  // tests expected to be found on Group.tests for updates,
  // cf server/controllers/groups/lib/update_group.js :
  // Group.tests[attribute](value)

  // Make sure the generated slug isn't an empty string
  name: str => boundedString(str, 1, 80) && _.isNonEmptyString(slugify(str)),
  picture: isGroupImg,
  description: BoundedString(0, 5000),
  searchable: boolean,
  position,
  open: boolean,
  creatorId: userId,
}
