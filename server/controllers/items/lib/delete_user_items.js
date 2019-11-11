CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
comments_ = __.require 'controllers', 'comments/lib/comments'
items_ = __.require 'controllers', 'items/lib/items'
promises_ = __.require 'lib', 'promises'

module.exports = (userId)->
  items_.byOwner userId
  .then items_.bulkDelete
