CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
{ItemId, UserId, EntityUri} = require './common-tests'

module.exports =
  itemId: (id)-> ItemId.test(id)
  title: (str)->
    _.type str, 'string'
    return str.length > 0
  userId: (userId)-> UserId.test(userId)
  entity: (entity)-> EntityUri.test(entity)
