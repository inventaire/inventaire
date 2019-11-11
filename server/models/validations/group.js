CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
slugify = __.require 'controllers', 'groups/lib/slugify'
{ pass, boundedString, BoundedString, localImg, boolean, position } = require './common'

module.exports =
  pass: pass

  # tests expected to be found on Group.tests for updates,
  # cf server/controllers/groups/lib/update_group.coffee:
  # Group.tests[attribute](value)

  # Make sure the generated slug isn't an empty string
  name: (str)-> boundedString(str, 1, 60) and _.isNonEmptyString(slugify(str))
  picture: localImg
  description: BoundedString 0, 5000
  searchable: boolean
  position: position
