CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
assert = require 'assert'
{UserId} = require './common-tests'

module.exports = (id, status)->
  assertValidId(id)
  assertValidStatus(status)
  return relation =
    _id: id
    type: 'relation'
    status: status


assertValidId = (id)->
  [ userA, userB ] = id.split ':'
  assert userA isnt userB
  assert UserId.test(userA)
  assert UserId.test(userB)

assertValidStatus = (status)->
  assert status in statuses

statuses = [
  'friends'
  'a-requested'
  'b-requested'
  'none'
]