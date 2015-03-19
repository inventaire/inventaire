CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'
assert = require 'assert'
{UserId} = require './tests/common-tests'

module.exports =
  create: (id, status)->
    assertValidId(id)
    assertValidStatus(status)
    return relation =
      _id: id
      type: 'relation'
      status: status
      created: _.now()

  docId: (userId, otherId) ->
    couch_.joinOrderedIds(userId, otherId)


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