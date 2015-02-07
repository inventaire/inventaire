CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
assert = require 'assert'
{EntityUri, EpochMs} = require './common-tests'

module.exports =
  validate: (item, userId)->
    _.types arguments, ['object', 'string']
    @assertValidOwnerFromId item._id, userId
    assertValidTitle item.title
    assertValidEntity item.entity
    item.owner = userId
    return item

  assertValidOwnerFromId: (id, userId)->
    [owner, entityDomain, entityId, time] = id.split ':'
    assert(owner is userId)
    assert EntityUri.test("#{entityDomain}:#{entityId}")
    assert EpochMs.test(time)


assertValidTitle = (id)->
  _.type id, 'string'
  assert id.length > 0

assertValidEntity = (id)->
  assert EntityUri.test(id)
