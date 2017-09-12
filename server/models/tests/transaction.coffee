CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ pass, userId, itemId } = require './common'

module.exports =
  pass: pass
  userId: userId
  itemId: itemId
