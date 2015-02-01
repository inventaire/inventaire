CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
assert = require 'assert'
{UserId} = require './common-tests'

module.exports =
  create: (userId)->
    assertValidId(userId)
    return follow =
      _id: @docId(userId)
      entities: {}
      transaction: 'following'
      listing: 'friends'

  docId: (userId)-> "#{userId}:following"

assertValidId = (userId)-> assert UserId.test(userId)
