CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
assert = require 'assert'
tests = require './tests/common-tests'

module.exports =
  create: (userId)->
    tests.pass 'userId', userId
    return follow =
      _id: @docId(userId)
      entities: {}
      transaction: 'following'
      listing: 'friends'

  docId: (userId)-> "#{userId}:following"
