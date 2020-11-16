const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const slugify = __.require('controllers', 'groups/lib/slugify')
const { pass, boundedString, BoundedString, localImg, boolean, position, userId } = require('./common')

module.exports = {
  pass,

  // tests expected to be found on Group.tests for updates,
  // cf server/controllers/groups/lib/update_group.js :
  // Group.tests[attribute](value)

  // Make sure the generated slug isn't an empty string
  name: str => boundedString(str, 1, 60) && _.isNonEmptyString(slugify(str)),
  picture: localImg,
  description: BoundedString(0, 5000),
  searchable: boolean,
  position,
  open: boolean,
  creatorId: userId
}
