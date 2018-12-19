CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'
assert = require 'assert'
{ userId } = require './validations/common'

module.exports =
  create: (id, status)->
    assertValidId(id)
    assertValidStatus(status)
    return _.log relation =
      _id: id
      type: 'relation'
      status: status
      created: Date.now()

  docId: (userId, otherId)->
    # TODO: add a receiver-read flag to stop notifying already read requestes
    couch_.joinOrderedIds(userId, otherId)

assertValidId = (id)->
  [ userA, userB ] = id.split ':'
  assert userA isnt userB
  _.assertType userA, 'string'
  assert userId(userA)
  assert userId(userB)

assertValidStatus = (status)->
  assert status in statuses

statuses = [
  'friends'
  'a-requested'
  'b-requested'
  'none'
]
