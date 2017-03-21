CONFIG = require 'config'
__ = CONFIG.universalPath
slugify = __.require 'controllers', 'groups/lib/slugify'
{ pass, underLimitString, nonEmptyString, localImg, boolean, position } = require './common-tests'

module.exports =
  pass: pass

  # tests expected to be found on Group.tests for updates,
  # cf server/controllers/groups/lib/update_group.coffee:
  # Group.tests[attribute](value)

  # Make sure the generated slug isn't an empty string
  name: (str)-> nonEmptyString(str, 60) and nonEmptyString(slugify(str))
  picture: localImg
  description: (str)-> underLimitString str, 5000
  searchable: boolean
  position: position
