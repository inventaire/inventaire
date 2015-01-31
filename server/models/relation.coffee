CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
assert = require 'assert'
{userId} = require './common-tests'

module.exports = (id, status)->
  assertValidId(id)
  assertValidStatus(status)
  return relation =
    _id: id
    type: 'relation'
    status: status


assertValidId = (id)->
  _.type id, 'string'
  [ userA, userB ] = id.split ':'
  assert userA isnt userB
  assert userId.test(userA)
  assert userId.test(userB)

assertValidStatus = (status)->
  _.type status, 'string'
  assert status in statuses

statuses = [
  'friends'
  'a-requested'
  'b-requested'
  'none'
]