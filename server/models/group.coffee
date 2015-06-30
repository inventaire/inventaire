CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

tests = require './tests/common-tests'

module.exports = Group = {}

Group.create = (name, creatorId)->
  tests.pass 'userId', creatorId
  tests.pass 'nonEmptyString', name, 60

  return group =
    type: 'group'
    name: name
    admin: [ creatorId ]
    members: []
    invited: []
    creator: creatorId
    created: _.now()
