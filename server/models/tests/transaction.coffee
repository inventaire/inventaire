CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
{ userId, itemId } = require './common-tests'

module.exports =
  userId: userId
  itemId: itemId
