// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const _ = require('builders/utils')
const slugify = require('controllers/groups/lib/slugify')
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
