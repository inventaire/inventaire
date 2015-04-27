CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
{ pass, userId, itemId } = require './common-tests'

module.exports =
  pass: pass
  userId: userId
  itemId: itemId
